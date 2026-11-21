const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Metindeki e-posta adreslerini küçük harfle döndürür. "[at]" yazımlarını da yakalar. */
export function extractEmails(text: string): Set<string> {
  const normalized = text
    .replace(/\s*(\[at\]|\(at\)|\{at\})\s*/gi, '@')
    .replace(/\s*(\[dot\]|\(dot\)|\{dot\})\s*/gi, '.');
  return new Set((normalized.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()));
}

export interface SourcePage {
  /** Sayfanın son adresi (yönlendirmeden sonra). */
  url: string;
  /** Düz metin. */
  text: string;
}

/** E-posta etki alanı sayfanın ana makinesiyle aynı mı (alt alan adı dahil)? */
export function domainMatchesHost(emailDomain: string, pageUrl: string): boolean {
  let host: string;
  try {
    host = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  const domain = emailDomain.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * İK maili yalnız kendi etki alanındaki bir kaynak sayfada geçiyorsa kabul edilir.
 * Üçüncü taraf sayfaya yerleştirilmiş adres (prompt-injection) doğrulanmaz.
 * Geçmiyorsa `null` döner; uydurulmuş adrese mail gitmez.
 */
export function verifyEmailInSources(
  email: string | null | undefined,
  pages: readonly SourcePage[],
): string | null {
  if (!email) return null;
  const target = email.trim().toLowerCase();
  const domain = target.split('@')[1] ?? '';
  if (!domain) return null;
  return pages.some((p) => domainMatchesHost(domain, p.url) && extractEmails(p.text).has(target))
    ? target
    : null;
}

/** HTML'i düz metne indirger (etiket, betik ve stil atılır). */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#64;|&commat;/gi, '@')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ');
}
