// Supabase Edge Function: translate (DeepL Free, key in secrets).
//
// Contract:
//   POST /functions/v1/translate
//   Request  JSON: { texts: string[], target_lang: 'ID' | 'EN' }
//   Success  200:  { translations: string[] }          (ordered per-index)
//   Errors   JSON: { code, message }
//     400 { code: 'BAD_REQUEST' }            texts not array 1..50, item not string or >5000 chars,
//                                            or target_lang not 'ID' | 'EN'
//     401 { code: 'AUTH' }                   missing Authorization Bearer header (admin JWT required)
//     503 { code: 'DEEPL_NOT_CONFIGURED' }   Supabase secret DEEPL_AUTH_KEY not set
//     502 { code: 'AUTH', ... }              DeepL 403 (usually Free key on Pro endpoint or vice versa)
//     429 { code: 'QUOTA' }                  DeepL 429 / 456 (rate limit / quota exhausted)
//     502 { code: 'UPSTREAM', ... }          any other DeepL failure
//
// DeepL call shape (Deno runtime, fetch only — no npm deps):
//   POST https://api-free.deepl.com/v2/translate
//   Header: Authorization: DeepL-Auth-Key <DEEPL_AUTH_KEY>
//   Body (x-www-form-urlencoded): text=<t1>&text=<t2>...&target_lang=<ID|EN-US>
//   source_lang omitted = auto-detect. Single upstream call per request (shared target_lang).
//
// curl shape (after `supabase secrets set DEEPL_AUTH_KEY=...:fx` + deploy):
//   curl -X POST "$SUPABASE_URL/functions/v1/translate" \
//     -H "apikey: $SUPABASE_ANON_KEY" \
//     -H "Authorization: Bearer <ADMIN_JWT>" \
//     -H "Content-Type: application/json" \
//     -d '{"texts":["Hello"],"target_lang":"ID"}'
//   → {"translations":["Halo"]}

// Minimal Deno global typing so repo `tsc --noEmit` (which globs **/*.ts)
// passes without a separate d.ts file or tsconfig change. The Deno runtime
// provides the real global; this is types-only and emits nothing.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";
const MAX_TEXTS = 50;
const MAX_CHARS = 5000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// EN mapping choice: DeepL v2 /translate does NOT accept bare 'EN' as a
// target language — it requires 'EN-GB' or 'EN-US' (bare 'EN' returns 400
// "target_lang is not supported"). We map contract 'EN' -> 'EN-US'
// (neutral international default; DeepL's own fallback for bare EN).
// 'ID' is passed through unchanged (supported as both source and target).
function mapTargetLang(target: "ID" | "EN"): string {
  return target === "EN" ? "EN-US" : "ID";
}

function badRequest(message: string): Response {
  return json(400, { code: "BAD_REQUEST", message });
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight for browser calls from the admin web panel.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json(405, { code: "BAD_REQUEST", message: "Use POST." });
  }

  // Auth: require a Supabase JWT. Full JWT verification happens at the
  // Supabase gateway (anon key + RLS); here we honestly enforce presence of
  // the Bearer token so anonymous curl without any token gets a 401 instead
  // of burning DeepL quota. Fine-grained admin checks stay in RLS/policies.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ") ||
    authHeader.slice(7).trim().length === 0) {
    return json(401, {
      code: "AUTH",
      message: "Missing Authorization Bearer token (admin sign-in required).",
    });
  }

  const deeplKey = Deno.env.get("DEEPL_AUTH_KEY");
  if (!deeplKey) {
    return json(503, {
      code: "DEEPL_NOT_CONFIGURED",
      message:
        "DeepL key not configured. Run: supabase secrets set DEEPL_AUTH_KEY=...:fx then: supabase functions deploy translate",
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const { texts, target_lang } = body as {
    texts?: unknown;
    target_lang?: unknown;
  };

  if (target_lang !== "ID" && target_lang !== "EN") {
    return badRequest("target_lang must be 'ID' or 'EN'.");
  }
  if (!Array.isArray(texts) || texts.length < 1 || texts.length > MAX_TEXTS) {
    return badRequest(`texts must be an array of 1..${MAX_TEXTS} strings.`);
  }
  for (const t of texts) {
    if (typeof t !== "string" || t.length > MAX_CHARS) {
      return badRequest(
        `Each text must be a string of at most ${MAX_CHARS} characters.`,
      );
    }
  }

  // Batch: single upstream call, repeated `text` params preserve order and
  // DeepL returns translations in the same order.
  const params = new URLSearchParams();
  for (const t of texts as string[]) params.append("text", t);
  params.append("target_lang", mapTargetLang(target_lang));

  let upstream: Response;
  try {
    upstream = await fetch(DEEPL_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${deeplKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (e) {
    return json(502, {
      code: "UPSTREAM",
      message: `DeepL request failed: ${(e as Error)?.message ?? e}`,
    });
  }

  if (upstream.ok) {
    const data = await upstream.json() as {
      translations?: { text?: string }[];
    };
    const translations = (data.translations ?? []).map((t) => t?.text ?? "");
    return json(200, { translations });
  }

  if (upstream.status === 403) {
    return json(502, {
      code: "AUTH",
      message:
        "DeepL rejected the auth key (403). If the key ends with :fx it is a Free key and must use the Free endpoint https://api-free.deepl.com; a Pro key must use https://api.deepl.com. Check for a Free↔Pro endpoint mix-up.",
    });
  }

  if (upstream.status === 429 || upstream.status === 456) {
    return json(429, {
      code: "QUOTA",
      message:
        "DeepL quota/rate limit hit (429/456). Free tier ≈500k chars/month. Retry later; admin saves must still persist source content.",
    });
  }

  const detail = await upstream.text().catch(() => "");
  return json(502, {
    code: "UPSTREAM",
    message: `DeepL error ${upstream.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
  });
});
