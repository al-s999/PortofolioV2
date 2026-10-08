import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const enPath = join(root, 'lib', 'local', 'en.json');
const idPath = join(root, 'lib', 'local', 'id.json');

const PINNED_INSTALL_EN = {
  title: 'Install app',
  description: 'Install this portfolio as an app for faster access.',
  action: 'Install App',
};

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`FAIL: cannot load ${path}: ${err.message}`);
    process.exit(1);
  }
}

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out[full] = value;
    }
  }
  return out;
}

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const en = load(enPath);
const id = load(idPath);
const flatEn = flatten(en);
const flatId = flatten(id);

const enKeys = new Set(Object.keys(flatEn));
const idKeys = new Set(Object.keys(flatId));
const missingInId = [...enKeys].filter((k) => !idKeys.has(k)).sort();
const extraInId = [...idKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInId.length > 0 || extraInId.length > 0) {
  if (missingInId.length > 0) console.error(`Keys missing in id.json:\n  ${missingInId.join('\n  ')}`);
  if (extraInId.length > 0) console.error(`Extra keys in id.json:\n  ${extraInId.join('\n  ')}`);
  fail('en.json and id.json key sets differ.');
}

// Pinned install copy (EN is source of truth).
const installEn = en.install ?? {};
for (const [key, expected] of Object.entries(PINNED_INSTALL_EN)) {
  if (installEn[key] !== expected) {
    fail(`install.${key} must equal pinned string ${JSON.stringify(expected)}, got ${JSON.stringify(installEn[key])}.`);
  }
}

// No "desktop" word anywhere in install namespace (either locale).
for (const [locale, dict] of [['en', en], ['id', id]]) {
  const flat = locale === 'en' ? flatEn : flatId;
  void dict;
  for (const [key, value] of Object.entries(flat)) {
    if (key === 'install' || key.startsWith('install.') || key.startsWith('toast.install')) {
      if (typeof value === 'string' && value.toLowerCase().includes('desktop')) {
        fail(`"${key}" in ${locale}.json contains forbidden word "desktop": ${JSON.stringify(value)}.`);
      }
    }
  }
}

// All leaf values must be non-empty strings.
for (const [locale, flat] of [['en', flatEn], ['id', flatId]]) {
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      fail(`"${key}" in ${locale}.json must be a non-empty string.`);
    }
  }
}

console.log(`i18n parity OK: ${enKeys.size} keys`);
