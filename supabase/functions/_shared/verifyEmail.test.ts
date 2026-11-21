import { describe, expect, it } from 'vitest';
import { domainMatchesHost, extractEmails, htmlToText, verifyEmailInSources } from './verifyEmail';

describe('verifyEmailInSources', () => {
  const html = '<p>Kariyer: <a href="mailto:ik@kuzgun.com.tr">ik@kuzgun.com.tr</a></p>';
  const pages = [{ url: 'https://www.kuzgun.com.tr/kariyer', text: htmlToText(html) }];

  it('kaynakta geçen adresi kabul eder (büyük/küçük harf duyarsız)', () => {
    expect(verifyEmailInSources('IK@Kuzgun.com.tr', pages)).toBe('ik@kuzgun.com.tr');
  });

  it('kaynakta olmayan adres null olur', () => {
    expect(verifyEmailInSources('hr@uydurma.com', pages)).toBeNull();
  });

  it('kaynak yoksa null olur', () => {
    expect(verifyEmailInSources('ik@kuzgun.com.tr', [])).toBeNull();
  });

  it('boş adres null olur', () => {
    expect(verifyEmailInSources(null, pages)).toBeNull();
  });

  it('alt dizgi eşleşmesini kabul etmez', () => {
    expect(verifyEmailInSources('k@kuzgun.com.tr', pages)).toBeNull();
  });

  it('başka etki alanındaki sayfaya yerleştirilmiş adresi kabul etmez', () => {
    const injected = [{ url: 'https://forum.example/konu', text: 'ik@saldirgan.example' }];
    expect(verifyEmailInSources('ik@saldirgan.example', injected)).toBeNull();
  });

  it('şirket adresi üçüncü taraf sayfada geçse de doğrulanmaz', () => {
    const third = [{ url: 'https://ilan.example/kuzgun', text: 'ik@kuzgun.com.tr' }];
    expect(verifyEmailInSources('ik@kuzgun.com.tr', third)).toBeNull();
  });
});

describe('domainMatchesHost', () => {
  it('aynı ana makineyi ve alt alan adını kabul eder', () => {
    expect(domainMatchesHost('kuzgun.com.tr', 'https://kuzgun.com.tr/')).toBe(true);
    expect(domainMatchesHost('kuzgun.com.tr', 'https://kariyer.kuzgun.com.tr/')).toBe(true);
  });

  it('benzer adlı başka etki alanını kabul etmez', () => {
    expect(domainMatchesHost('kuzgun.com.tr', 'https://kuzgun.com.tr.evil.example/')).toBe(false);
    expect(domainMatchesHost('kuzgun.com.tr', 'https://notkuzgun.com.tr/')).toBe(false);
    expect(domainMatchesHost('kuzgun.com.tr', 'gecersiz')).toBe(false);
  });
});

describe('extractEmails', () => {
  it('[at] ve [dot] yazımlarını çözer', () => {
    expect(extractEmails('kariyer [at] ardic [dot] com').has('kariyer@ardic.com')).toBe(true);
  });

  it('HTML varlığıyla yazılmış @ işaretini çözer', () => {
    expect(extractEmails(htmlToText('ik&#64;selvi.com.tr')).has('ik@selvi.com.tr')).toBe(true);
  });
});
