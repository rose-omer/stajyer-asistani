// Kaynak sayfa indirme: SSRF ve büyük gövdeye karşı sınırlı.
// Yönlendirme elle izlenir; her adım yeniden denetlenir.

export const MAX_PAGE_BYTES = 500_000;
export const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 5_000;
const TEXT_TYPES = /^(text\/html|text\/plain|application\/xhtml\+xml)/i;

export interface FetchedPage {
  /** Yönlendirmelerden sonra ulaşılan son adres. */
  url: string;
  body: string;
}

/** Yalnız standart portta https, kimlik bilgisiz, IP olmayan, genel ad. */
export function isAllowedUrl(raw: string | URL): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  if (url.port && url.port !== '443') return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.startsWith('[')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  return !/(^|\.)(localhost|local|internal|lan|home|arpa)$/.test(host);
}

/** Gövdeyi akışla okur; sınır aşılınca okumayı keser. */
export async function readLimited(res: Response, maxBytes = MAX_PAGE_BYTES): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - size;
    const chunk = value.byteLength > room ? value.subarray(0, room) : value;
    size += chunk.byteLength;
    text += decoder.decode(chunk, { stream: true });
    if (size >= maxBytes) {
      await reader.cancel().catch(() => undefined);
      break;
    }
  }
  return text + decoder.decode();
}

/** Sayfayı indirir. İzin dışı adres, hata ya da metin olmayan içerikte boş gövde döner. */
export async function fetchPageSafe(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedPage> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUrl(current)) return { url: current, body: '' };
    const res = await fetchImpl(current, {
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': 'stajyer-asistani/2 (+kaynak dogrulama)' },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      await res.body?.cancel().catch(() => undefined);
      if (!location) return { url: current, body: '' };
      current = new URL(location, current).toString();
      continue;
    }
    if (!res.ok || !TEXT_TYPES.test(res.headers.get('content-type') ?? '')) {
      await res.body?.cancel().catch(() => undefined);
      return { url: current, body: '' };
    }
    return { url: current, body: await readLimited(res) };
  }
  return { url: current, body: '' };
}
