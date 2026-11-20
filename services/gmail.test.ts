import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/errors';
import { sendGmailMessage } from './gmail';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('sendGmailMessage (sahte Gmail uç noktası)', () => {
  it('başarılı yanıtta ileti kimliğini döndürür ve base64url gönderir', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json(200, { id: '18c0ffee', threadId: 't1' }),
    );
    const id = await sendGmailMessage('To: a@b.co\r\n\r\nselam', 'jeton', undefined, fetchImpl);
    expect(id).toBe('18c0ffee');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jeton');
    const raw = JSON.parse(String(init?.body)).raw as string;
    expect(raw).not.toMatch(/[+/=]/);
  });

  it('hata yanıtını okur ve SEND_FAILED atar', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json(403, { error: { message: 'Insufficient Permission' } }),
    );
    const promise = sendGmailMessage('x', 'jeton', undefined, fetchImpl);
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(sendGmailMessage('x', 'jeton', undefined, fetchImpl)).rejects.toThrow(
      'Insufficient Permission',
    );
  });

  it('200 dönse bile kimlik yoksa başarı saymaz', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json(200, {}));
    await expect(sendGmailMessage('x', 'jeton', undefined, fetchImpl)).rejects.toMatchObject({
      code: 'SEND_FAILED',
    });
  });
});
