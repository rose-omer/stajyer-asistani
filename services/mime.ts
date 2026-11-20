/**
 * Gmail API için RFC 2822 / MIME ileti kurucu.
 * Türkçe karakterler: başlıklar RFC 2047 (UTF-8, B), gövde base64.
 */

export interface MimeAttachment {
  filename: string;
  mimeType: string;
  /** Standart base64 (satır sonu yok). */
  base64: string;
}

export interface MimeMessage {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  attachment?: MimeAttachment;
}

const CRLF = '\r\n';

export function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function toBase64Url(value: string): string {
  return utf8ToBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** ASCII dışı başlık değerini RFC 2047 kodlu sözcüğe çevirir. */
export function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${utf8ToBase64(value)}?=`;
}

function wrap76(base64: string): string {
  return base64.match(/.{1,76}/g)?.join(CRLF) ?? '';
}

/** Başlık enjeksiyonunu önler: satır sonu içeren değer reddedilir. */
function headerValue(name: string, value: string): string {
  if (/[\r\n]/.test(value)) throw new Error(`${name} başlığı satır sonu içeremez.`);
  return value;
}

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function buildMimeMessage(msg: MimeMessage, boundary = defaultBoundary()): string {
  const to = headerValue('To', msg.to.trim());
  if (!isValidEmail(to)) throw new Error('Alıcı adresi geçersiz.');

  const headers = [`To: ${to}`];
  if (msg.fromEmail) {
    const from = headerValue('From', msg.fromEmail.trim());
    headers.push(
      msg.fromName
        ? `From: ${encodeHeader(headerValue('From', msg.fromName))} <${from}>`
        : `From: ${from}`,
    );
  }
  headers.push(
    `Subject: ${encodeHeader(headerValue('Subject', msg.subject))}`,
    'MIME-Version: 1.0',
  );

  const bodyPart = [
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(utf8ToBase64(msg.body.replace(/\r?\n/g, CRLF))),
  ].join(CRLF);

  if (!msg.attachment) {
    return [...headers, bodyPart].join(CRLF);
  }

  const a = msg.attachment;
  const filename = encodeHeader(headerValue('filename', a.filename));
  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    bodyPart,
    `--${boundary}`,
    `Content-Type: ${headerValue('Content-Type', a.mimeType)}; name="${filename}"`,
    `Content-Disposition: attachment; filename="${filename}"`,
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(a.base64),
    `--${boundary}--`,
    '',
  ].join(CRLF);
}

function defaultBoundary(): string {
  return `sa_${crypto.randomUUID().replace(/-/g, '')}`;
}
