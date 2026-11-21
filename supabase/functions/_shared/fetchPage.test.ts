import { describe, expect, it, vi } from 'vitest';
import { MAX_PAGE_BYTES, fetchPageSafe, isAllowedUrl, readLimited } from './fetchPage';

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init });

const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });

describe('isAllowedUrl', () => {
  it('genel https adresini kabul eder', () => {
    expect(isAllowedUrl('https://kuzgun.example/kariyer')).toBe(true);
  });

  it.each([
    'http://kuzgun.example',
    'https://127.0.0.1/',
    'https://[::1]/',
    'https://localhost/',
    'https://servis.internal/',
    'https://kuzgun.example:8443/',
    'https://kullanici:sifre@kuzgun.example/',
    'file:///etc/passwd',
    'gecersiz',
  ])('%s adresini reddeder', (url) => {
    expect(isAllowedUrl(url)).toBe(false);
  });
});

describe('readLimited', () => {
  it('sınırı aşan gövdeyi keser', async () => {
    const text = await readLimited(new Response('a'.repeat(50)), 10);
    expect(text).toBe('a'.repeat(10));
  });
});

describe('fetchPageSafe', () => {
  it('yönlendirmeyi izler ve son adresi döndürür', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redirect('https://kuzgun.example/kariyer'))
      .mockResolvedValueOnce(html('<p>ik@kuzgun.example</p>'));
    const page = await fetchPageSafe('https://arama.example/yonlendir', fetchImpl);
    expect(page).toEqual({
      url: 'https://kuzgun.example/kariyer',
      body: '<p>ik@kuzgun.example</p>',
    });
    expect(fetchImpl.mock.calls[0][1]?.redirect).toBe('manual');
  });

  it('iç ağa yönlendirmeyi izlemez', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(redirect('https://127.0.0.1/'));
    const page = await fetchPageSafe('https://arama.example/', fetchImpl);
    expect(page.body).toBe('');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('en çok 3 yönlendirme izler', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => redirect('https://dongu.example/'));
    const page = await fetchPageSafe('https://dongu.example/', fetchImpl);
    expect(page.body).toBe('');
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('metin olmayan içeriği okumaz', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      html('PDF', { headers: { 'content-type': 'application/pdf' } }),
    );
    expect((await fetchPageSafe('https://kuzgun.example/a.pdf', fetchImpl)).body).toBe('');
  });

  it('büyük gövdeyi sınırda keser', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => html('x'.repeat(MAX_PAGE_BYTES + 100)));
    const page = await fetchPageSafe('https://kuzgun.example/', fetchImpl);
    expect(page.body.length).toBe(MAX_PAGE_BYTES);
  });
});
