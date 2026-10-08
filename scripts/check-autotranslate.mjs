// Task 8 check: collect/merge/translateViaEdge assertions (no network).
// Usage:
//   npx tsc lib/i18n/autoTranslate.ts lib/supabase/client.ts --outDir <build> \
//     --module commonjs --target es2020 --moduleResolution node \
//     --esModuleInterop --skipLibCheck
//   node scripts/check-autotranslate.mjs <build>
// (Two steps because this sandbox has no /bin/sh for child_process.)
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';

const buildDir = process.argv[2];
if (!buildDir) {
  console.error('usage: node scripts/check-autotranslate.mjs <tsc-outdir>');
  process.exit(2);
}
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const mod = require(join(resolve(process.cwd(), buildDir), 'i18n', 'autoTranslate.js'));
const { collectTranslatables, mergeTranslations, translateViaEdge } = mod;

// 1. Plan's pinned case: only `title` survives.
assert.deepEqual(
  collectTranslatables('projects', {
    title: 'Hi',
    github_url: 'https://x',
    tech_stack: ['React'],
  }),
  [{ path: 'title', text: 'Hi' }],
);

// 2. projects allowlist: text-block content + any-block caption; skips urls/empty/numbers.
const projItems = collectTranslatables('projects', {
  title: 'T',
  description: 'D',
  short_description: '  ',
  demo_url: 'https://demo.example',
  featured: true,
  order_index: 3,
  content_blocks: [
    { id: 'a', type: 'text', content: 'Hello', caption: 'Cap' },
    { id: 'b', type: 'image', content: 'should-not-collect', image_url: 'https://img', caption: 'Pic' },
    { id: 'c', type: 'image', image_url: 'https://img' },
  ],
});
assert.deepEqual(projItems, [
  { path: 'title', text: 'T' },
  { path: 'description', text: 'D' },
  { path: 'content_blocks.0.content', text: 'Hello' },
  { path: 'content_blocks.0.caption', text: 'Cap' },
  { path: 'content_blocks.1.caption', text: 'Pic' },
]);

// 3. about_me: ✅ content/profession/degree/description/role;
//    🚫 full_name, nickname, institution, year, skills, urls.
const aboutItems = collectTranslatables('about_me', {
  full_name: 'Jane Doe',
  nickname: 'jane',
  content: 'About text',
  profession: 'Engineer',
  avatar_url: 'https://avatar',
  skills: [{ name: 'React', level: 5 }],
  education: [{ degree: 'BSc', institution: 'Uni', year: '2020', description: 'Studied things' }],
  experience: [{ role: 'Dev', company: 'Acme', year: '2021', description: 'Built stuff', technologies: ['Go'] }],
});
assert.deepEqual(aboutItems, [
  { path: 'content', text: 'About text' },
  { path: 'profession', text: 'Engineer' },
  { path: 'education.0.degree', text: 'BSc' },
  { path: 'education.0.description', text: 'Studied things' },
  { path: 'experience.0.role', text: 'Dev' },
  { path: 'experience.0.description', text: 'Built stuff' },
]);

// 4. contacts: label only; value/icon/enums skipped.
assert.deepEqual(
  collectTranslatables('contacts', {
    type: 'email', label: 'Email me', value: 'a@b.com', icon: 'mail', is_active: true,
  }),
  [{ path: 'label', text: 'Email me' }],
);

// 5. Skip rules: empty, whitespace, URL-like, email, pure numbers.
assert.deepEqual(collectTranslatables('contacts', { label: '   ' }), []);
assert.deepEqual(collectTranslatables('contacts', { label: 'https://x.com/y' }), []);
assert.deepEqual(collectTranslatables('contacts', { label: 'mailto:a@b.com' }), []);
assert.deepEqual(collectTranslatables('contacts', { label: 'a@b.com' }), []);
assert.deepEqual(collectTranslatables('contacts', { label: '2024' }), []);
assert.deepEqual(collectTranslatables('projects', { title: 42 }), []);

// 6. mergeTranslations: sets i18n.<lang> nested paths, preserves source + existing mirror.
const src = {
  title: 'Hi',
  github_url: 'https://x',
  i18n: { id: { description: 'Halo desc' } },
};
const merged = mergeTranslations(
  src,
  [{ path: 'title', text: 'Hi' }],
  ['Halo'],
  'id',
);
assert.equal(merged.title, 'Hi');
assert.equal(merged.github_url, 'https://x');
assert.deepEqual(merged.i18n, { id: { description: 'Halo desc', title: 'Halo' } });
assert.deepEqual(src.i18n, { id: { description: 'Halo desc' } }); // no input mutation

// 7. mergeTranslations: nested array paths build structure.
const merged2 = mergeTranslations(
  { content: 'x' },
  [{ path: 'education.0.description', text: 'Studied' }],
  ['Belajar'],
  'id',
);
assert.deepEqual(merged2.i18n, { id: { education: [{ description: 'Belajar' }] } });
assert.equal(merged2.content, 'x');

// 8. translateViaEdge([]) resolves [] with zero network (fetch stub throws).
const origFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('network must not be touched'); };
try {
  assert.deepEqual(await translateViaEdge([], 'ID'), []);
} finally {
  globalThis.fetch = origFetch;
}

console.log('check-autotranslate: PASS (8 groups)');
