import { AppError } from '../lib/errors';
import { toBase64Url } from './mime';

/**
 * Gmail API ile gönderim. Kullanıcı kendi Google hesabından, kendi OAuth jetonuyla gönderir.
 * Kapsam yalnız gmail.send. Jeton yalnız bellekte tutulur.
 */
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
    error_callback?: (err: { type: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

let token: { value: string; expiresAt: number } | null = null;
let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new AppError('Google oturum betiği yüklenemedi.', 'NETWORK_ERROR'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Geçerli jeton yoksa Google izin penceresini açar. */
export async function getGmailToken(clientId: string): Promise<string> {
  if (token && token.expiresAt - 60_000 > Date.now()) return token.value;
  await loadGis();
  const oauth2 = window.google!.accounts.oauth2;
  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SEND_SCOPE,
      callback: (resp) => {
        if (!resp.access_token) {
          reject(new AppError('Gmail izni verilmedi.', 'SEND_FAILED'));
          return;
        }
        token = {
          value: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
        };
        resolve(resp.access_token);
      },
      error_callback: () => reject(new AppError('Gmail izin penceresi kapatıldı.', 'SEND_FAILED')),
    });
    client.requestAccessToken();
  });
}

export function clearGmailToken(): void {
  token = null;
}

/** Ham MIME iletisini gönderir; Gmail ileti kimliğini döndürür. Yanıt her zaman okunur. */
export async function sendGmailMessage(
  mime: string,
  accessToken: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl(SEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(mime) }),
    signal,
  });
  let data: { id?: string; error?: { message?: string } } = {};
  try {
    data = await res.json();
  } catch {
    // Gövde JSON değilse aşağıda durum koduna göre hata atılır.
  }
  if (res.status === 401) clearGmailToken();
  if (!res.ok || !data.id) {
    const reason = data.error?.message ?? `HTTP ${res.status}`;
    throw new AppError(`Mail gönderilemedi: ${reason}`, 'SEND_FAILED', res.status);
  }
  return data.id;
}
