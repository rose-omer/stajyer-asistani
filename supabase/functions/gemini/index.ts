// Supabase Edge Function (Deno). Gemini anahtarı yalnız burada, sunucuda kalır.
// Dağıtım: supabase secrets set GEMINI_API_KEY=... ALLOWED_ORIGIN=https://<site>
//          (isteğe bağlı GEMINI_MODEL=gemini-3.5-flash-lite)
//          supabase functions deploy gemini
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { createHandlers, type GenerateFn } from '../_shared/handlers.ts';
import { fetchPageSafe } from '../_shared/fetchPage.ts';
import { resolveModel } from '../_shared/model.ts';
import { AiRequestSchema, ModelOutputError } from '../_shared/schemas.ts';

const MODEL = resolveModel(Deno.env.get('GEMINI_MODEL'));
const DAILY_AI_LIMIT = Number(Deno.env.get('DAILY_AI_LIMIT') ?? '60');
// Varsayılan yok: ayar unutulursa CORS açık kalmaz, tarayıcı istekleri reddedilir.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN')?.trim() ?? '';
if (!ALLOWED_ORIGIN) {
  console.warn('ALLOWED_ORIGIN ayarlı değil: tarayıcı istekleri CORS ile reddedilir.');
} else if (ALLOWED_ORIGIN === '*') {
  console.warn('ALLOWED_ORIGIN "*": yalnız yerel geliştirmede kullanın.');
}
const REQUEST_TIMEOUT_MS = 45_000;

const cors: Record<string, string> = {
  ...(ALLOWED_ORIGIN ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } : {}),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, code: string, message: string): Response {
  return json(status, { error: { code, message } });
}

const ai = new GoogleGenAI({ apiKey: Deno.env.get('GEMINI_API_KEY') ?? '' });

function makeGenerate(signal: AbortSignal): GenerateFn {
  return async ({ system, parts, jsonSchema, search }) => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: system,
        abortSignal: signal,
        ...(search ? { tools: [{ googleSearch: {} }] } : {}),
        ...(jsonSchema
          ? { responseMimeType: 'application/json', responseJsonSchema: jsonSchema }
          : {}),
      },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
      .map((c) => c.web?.uri)
      .filter((u): u is string => typeof u === 'string' && u.startsWith('https://'));
    return { text: response.text ?? '', sources: [...new Set(sources)] };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED', 'Yalnız POST kabul edilir.');

  // 1) Oturum: geçerli kullanıcı JWT'si zorunlu.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return fail(401, 'UNAUTHORIZED', 'Oturum açmanız gerekiyor.');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return fail(401, 'UNAUTHORIZED', 'Oturum geçersiz.');

  // 2) İstek gövdesi şemayla doğrulanır.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'BAD_REQUEST', 'İstek gövdesi JSON değil.');
  }
  const parsed = AiRequestSchema.safeParse(body);
  if (!parsed.success) return fail(422, 'VALIDATION_ERROR', 'İstek alanları geçersiz.');

  // 3) Kullanıcı başına günlük AI istek kotası.
  const { data: used, error: quotaError } = await supabase.rpc('consume_ai_request');
  if (quotaError) {
    console.error('quota rpc failed', quotaError.message);
    return fail(500, 'INTERNAL_ERROR', 'Kota denetlenemedi.');
  }
  if (typeof used === 'number' && used > DAILY_AI_LIMIT) {
    return fail(429, 'RATE_LIMITED', `Günlük AI istek sınırına ulaştınız (${DAILY_AI_LIMIT}).`);
  }

  // 4) İşlem.
  const signal = AbortSignal.any([req.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
  const handle = createHandlers(makeGenerate(signal), (url) => fetchPageSafe(url));
  try {
    const result = await handle(parsed.data);
    return json(200, { model: MODEL, data: result });
  } catch (error) {
    if (error instanceof ModelOutputError) {
      return fail(502, 'MODEL_OUTPUT_INVALID', error.message);
    }
    if (signal.aborted) return fail(499, 'ABORTED', 'İstek iptal edildi.');
    console.error('gemini call failed', error instanceof Error ? error.message : error);
    return fail(502, 'UPSTREAM_ERROR', 'Yapay zeka servisine ulaşılamadı.');
  }
});
