/** Şirket adını karşılaştırma için normalleştirir (Türkçe küçük harf, tek boşluk). */
export function normalizeName(name: string): string {
  return name.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function newId(): string {
  return crypto.randomUUID();
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

export function isSameLocalDay(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Arama kutusu eşleşmesi: sorgu boşsa her şey eşleşir; Türkçe küçük harfle karşılaştırır. */
export function matchesQuery(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = normalizeName(query);
  if (!q) return true;
  return fields.some((f) => f && normalizeName(f).includes(q));
}

/** Ad soyaddan iki harflik baş harf (ör. "Deniz Aksoy" için "DA"). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toLocaleUpperCase('tr-TR');
}
