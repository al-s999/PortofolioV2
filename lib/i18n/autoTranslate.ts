// Client helper for DeepL auto-translate via the Supabase Edge Function.
//
// Consumes the contract from `supabase/functions/translate/index.ts`:
//   POST { texts: string[], target_lang: 'ID' | 'EN' }
//   -> { translations: string[] } | { code, message }
//
// Field allowlist (translate ✅):
//   about_me: content, profession, education[].degree/description,
//             experience[].role/description
//   projects: title, description, short_description,
//             content_blocks[] (type text -> content; any block -> caption)
//   contacts: label
// NEVER translated (🚫): full_name, nickname, skill/tech names, icon,
// *url* fields, contact value, year, enums/booleans/numbers.
//
// Skipped strings (saves quota, left byte-identical): empty/whitespace-only,
// URL-like (http(s)://, mailto:, tel:, whole-string email), pure numbers.

import { supabase } from '../supabase/client';

export type TranslatableTable = 'about_me' | 'projects' | 'contacts';

export interface TranslatableItem {
  /** Dot path into the i18n.<lang> mirror, e.g. 'education.0.description'. */
  path: string;
  text: string;
}

export type TranslateErrorCode =
  | 'QUOTA'
  | 'AUTH'
  | 'UPSTREAM'
  | 'DEEPL_NOT_CONFIGURED'
  | 'BAD_REQUEST';

const URL_LIKE_RE = /^(https?:\/\/|mailto:|tel:)/i;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PURE_NUMBER_RE = /^[+-]?[\d]+([.,][\d]+)*$/;

function isSkippable(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const t = value.trim();
  if (t.length === 0) return true;
  if (URL_LIKE_RE.test(t)) return true;
  if (EMAIL_RE.test(t)) return true;
  if (PURE_NUMBER_RE.test(t)) return true;
  return false;
}

function pushIfTranslatable(
  out: TranslatableItem[],
  path: string,
  value: unknown,
): void {
  if (isSkippable(value)) return;
  out.push({ path, text: value as string });
}

export function collectTranslatables(
  table: TranslatableTable,
  data: any,
): TranslatableItem[] {
  const out: TranslatableItem[] = [];
  if (!data || typeof data !== 'object') return out;

  if (table === 'about_me') {
    pushIfTranslatable(out, 'content', data.content);
    pushIfTranslatable(out, 'profession', data.profession);
    if (Array.isArray(data.education)) {
      data.education.forEach((ed: any, i: number) => {
        if (!ed || typeof ed !== 'object') return;
        // 🚫 institution, year intentionally excluded
        pushIfTranslatable(out, `education.${i}.degree`, ed.degree);
        pushIfTranslatable(out, `education.${i}.description`, ed.description);
      });
    }
    if (Array.isArray(data.experience)) {
      data.experience.forEach((ex: any, i: number) => {
        if (!ex || typeof ex !== 'object') return;
        // 🚫 company, year, technologies intentionally excluded
        pushIfTranslatable(out, `experience.${i}.role`, ex.role);
        pushIfTranslatable(out, `experience.${i}.description`, ex.description);
      });
    }
    // 🚫 full_name, nickname, skills, certificates, avatar_url, cv_url excluded
  } else if (table === 'projects') {
    pushIfTranslatable(out, 'title', data.title);
    pushIfTranslatable(out, 'description', data.description);
    pushIfTranslatable(out, 'short_description', data.short_description);
    if (Array.isArray(data.content_blocks)) {
      data.content_blocks.forEach((block: any, i: number) => {
        if (!block || typeof block !== 'object') return;
        // text blocks translate `content`; every block type may translate `caption`.
        if (block.type === 'text') {
          pushIfTranslatable(out, `content_blocks.${i}.content`, block.content);
        }
        pushIfTranslatable(out, `content_blocks.${i}.caption`, block.caption);
        // 🚫 id, type, image_url excluded
      });
    }
    // 🚫 image_url, tech_stack, github_url, demo_url, featured, order_index excluded
  } else {
    // contacts
    pushIfTranslatable(out, 'label', data.label);
    // 🚫 type, value, icon, order_index, is_active excluded
  }

  return out;
}

function withCode(message: string, code: TranslateErrorCode): Error {
  const err = new Error(message) as Error & { code: TranslateErrorCode };
  err.code = code;
  return err;
}

function asCode(value: unknown): TranslateErrorCode | null {
  return value === 'QUOTA' ||
    value === 'AUTH' ||
    value === 'UPSTREAM' ||
    value === 'DEEPL_NOT_CONFIGURED' ||
    value === 'BAD_REQUEST'
    ? value
    : null;
}

function codeFromStatus(status: unknown): TranslateErrorCode | null {
  if (status === 429) return 'QUOTA';
  if (status === 401) return 'AUTH';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 503) return 'DEEPL_NOT_CONFIGURED';
  if (typeof status === 'number' && status >= 500) return 'UPSTREAM';
  return null;
}

/** Best-effort extraction of the Edge Function `{ code, message }` body. */
async function errorFromInvokeError(error: unknown): Promise<never> {
  const err = error as {
    context?: unknown;
    status?: unknown;
    message?: unknown;
  } | null;
  const context = err?.context;

  // supabase-js v2 surfaces the parsed JSON body on `context` in most builds.
  if (context && typeof context === 'object' && !(context instanceof Response)) {
    const body = context as { code?: unknown; message?: unknown };
    const code = asCode(body.code);
    if (code) {
      throw withCode(
        typeof body.message === 'string' ? body.message : code,
        code,
      );
    }
  }

  // Some builds put the raw Response on `context`.
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as {
        code?: unknown;
        message?: unknown;
      };
      const code = asCode(body.code) ?? codeFromStatus(context.status);
      throw withCode(
        typeof body.message === 'string'
          ? body.message
          : `Translate failed (HTTP ${context.status}).`,
        code ?? 'UPSTREAM',
      );
    } catch (e) {
      if ((e as { code?: unknown })?.code) throw e;
    }
    throw withCode(
      `Translate failed (HTTP ${context.status}).`,
      codeFromStatus(context.status) ?? 'UPSTREAM',
    );
  }

  // Fallback: status on the error itself, or JSON encoded in message.
  const statusCode = codeFromStatus((err as { status?: unknown })?.status);
  if (typeof err?.message === 'string') {
    try {
      const parsed = JSON.parse(err.message) as {
        code?: unknown;
        message?: unknown;
      };
      const code = asCode(parsed.code) ?? statusCode;
      if (code) {
        throw withCode(
          typeof parsed.message === 'string' ? parsed.message : code,
          code,
        );
      }
    } catch (e) {
      if ((e as { code?: unknown })?.code) throw e;
    }
  }
  throw withCode(
    'Translate request failed before reaching DeepL.',
    statusCode ?? 'UPSTREAM',
  );
}

export async function translateViaEdge(
  texts: string[],
  targetLang: 'ID' | 'EN',
): Promise<string[]> {
  if (texts.length === 0) return [];

  let data: unknown;
  let error: unknown;
  try {
    const res = await supabase.functions.invoke('translate', {
      body: { texts, target_lang: targetLang },
    });
    data = res.data;
    error = res.error;
  } catch (e) {
    await errorFromInvokeError(e);
    throw withCode('Translate request failed.', 'UPSTREAM'); // unreachable
  }

  if (error) await errorFromInvokeError(error);

  const translations = (data as { translations?: unknown } | null)?.translations;
  if (!Array.isArray(translations)) {
    throw withCode(
      'Translate returned an unexpected response shape.',
      'UPSTREAM',
    );
  }
  return translations.map((t) => (typeof t === 'string' ? t : ''));
}

function setPath(root: Record<string, any>, path: string, value: string): void {
  const segments = path.split('.');
  let node: any = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    const nextIsIndex = /^\d+$/.test(segments[i + 1]);
    if (/^\d+$/.test(seg)) {
      const idx = Number(seg);
      if (!Array.isArray(node)) return; // shape mismatch — drop silently
      if (node[idx] == null || typeof node[idx] !== 'object') {
        node[idx] = nextIsIndex ? [] : {};
      }
      node = node[idx];
    } else {
      if (node[seg] == null || typeof node[seg] !== 'object') {
        node[seg] = nextIsIndex ? [] : {};
      }
      node = node[seg];
    }
  }
  node[segments[segments.length - 1]] = value;
}

function deepClone<T>(value: T): T {
  return value === undefined
    ? value
    : (JSON.parse(JSON.stringify(value)) as T);
}

export function mergeTranslations(
  data: any,
  items: TranslatableItem[],
  results: string[],
  targetLang: 'en' | 'id',
): any {
  const base = data != null && typeof data === 'object' ? data : {};
  const mirror = deepClone(
    (base.i18n as Record<string, unknown> | undefined)?.[targetLang] as
      | Record<string, unknown>
      | undefined,
  ) as Record<string, unknown> | undefined;
  const next: Record<string, any> =
    mirror && typeof mirror === 'object' ? mirror : {};
  const count = Math.min(items.length, results.length);
  for (let i = 0; i < count; i += 1) {
    setPath(next, items[i].path, results[i]);
  }
  return {
    ...base,
    i18n: { ...(base.i18n ?? {}), [targetLang]: next },
  };
}
