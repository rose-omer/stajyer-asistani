import { describe, expect, it } from 'vitest';
import { buildMimeMessage, encodeHeader, toBase64Url, utf8ToBase64 } from './mime';

const decode = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

describe('buildMimeMessage', () => {
  const pdf = btoa('%PDF-1.4 sahte icerik');
  const msg = buildMimeMessage(
    {
      to: 'ik@kuzgun.example',
      subject: 'Staj başvurusu – Deniz Aksoy',
      body: 'Merhaba,\nİşletmede Mesleki Eğitim için yazıyorum.',
      attachment: { filename: 'Deniz_Özgeçmiş.pdf', mimeType: 'application/pdf', base64: pdf },
    },
    'SINIR',
  );

  it('başlıklar CRLF ile ayrılır ve zorunlu başlıkları içerir', () => {
    const [head] = msg.split('\r\n\r\n');
    const lines = head.split('\r\n');
    expect(lines).toContain('To: ik@kuzgun.example');
    expect(lines).toContain('MIME-Version: 1.0');
    expect(lines).toContain('Content-Type: multipart/mixed; boundary="SINIR"');
    expect(msg.includes('\n') && !/[^\r]\n/.test(msg)).toBe(true);
  });

  it('Türkçe konu RFC 2047 ile kodlanır', () => {
    const subjectLine = msg.split('\r\n').find((l) => l.startsWith('Subject: '))!;
    const encoded = subjectLine.replace('Subject: =?UTF-8?B?', '').replace('?=', '');
    expect(decode(encoded)).toBe('Staj başvurusu – Deniz Aksoy');
  });

  it('PDF eki ayrı parçada, base64 ve dosya adı kodlu', () => {
    expect(msg).toContain('--SINIR\r\nContent-Type: application/pdf; name="=?UTF-8?B?');
    expect(msg).toContain('Content-Disposition: attachment; filename="=?UTF-8?B?');
    expect(msg).toContain(pdf);
    expect(msg.trimEnd().endsWith('--SINIR--')).toBe(true);
  });

  it('gövde UTF-8 base64 olarak korunur', () => {
    const part = msg.split('--SINIR\r\n')[1];
    const b64 = part.split('\r\n\r\n')[1].replace(/\r\n/g, '');
    expect(decode(b64)).toBe('Merhaba,\r\nİşletmede Mesleki Eğitim için yazıyorum.');
  });

  it('base64 satırları 76 karakteri geçmez', () => {
    const long = buildMimeMessage({ to: 'a@b.co', subject: 'x', body: 'ş'.repeat(400) });
    const bodyLines = long.split('\r\n\r\n')[1].split('\r\n');
    expect(Math.max(...bodyLines.map((l) => l.length))).toBeLessThanOrEqual(76);
  });

  it('eksiz ileti tek parçalıdır', () => {
    const plain = buildMimeMessage({ to: 'a@b.co', subject: 'Selam', body: 'Metin' });
    expect(plain).not.toContain('multipart');
    expect(plain).toContain('Content-Type: text/plain; charset="UTF-8"');
  });

  it('başlık enjeksiyonunu reddeder', () => {
    expect(() =>
      buildMimeMessage({ to: 'a@b.co', subject: 'x\r\nBcc: kurban@example.com', body: 'y' }),
    ).toThrow();
  });

  it('geçersiz alıcıyı reddeder', () => {
    expect(() => buildMimeMessage({ to: 'adres-yok', subject: 'x', body: 'y' })).toThrow('Alıcı');
  });
});

describe('base64url', () => {
  it('+ / = karakterlerini dönüştürür', () => {
    const value = 'ûÿþ?>';
    const std = utf8ToBase64(value);
    const url = toBase64Url(value);
    expect(std).toMatch(/[+/=]/);
    expect(url).not.toMatch(/[+/=]/);
    expect(url).toBe(std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  });

  it('ASCII başlık değişmeden kalır', () => {
    expect(encodeHeader('Internship application')).toBe('Internship application');
  });
});
