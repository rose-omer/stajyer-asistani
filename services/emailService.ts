import { config, canSendWithGmail } from '../lib/config';
import { AppError } from '../lib/errors';
import type { CvFile, TargetCompany } from '../types';
import { getGmailToken, sendGmailMessage } from './gmail';
import { buildMimeMessage, isValidEmail } from './mime';

/** Taslağı kullanıcının mail uygulamasında açar. Ek dosya taşınmaz. */
export function mailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Onaylanmış tek bir başvuruyu Gmail ile gönderir.
 * Bu fonksiyonu yalnız onay penceresinden sonra arayüz çağırır.
 */
export async function sendApplication(
  company: TargetCompany,
  cv: CvFile | null,
  signal?: AbortSignal,
): Promise<string> {
  if (!canSendWithGmail) throw new AppError('Gönderim kapalı.', 'SEND_DISABLED');
  const to = company.recipient?.trim() ?? '';
  if (!isValidEmail(to)) throw new AppError('Alıcı adresi geçersiz.', 'SEND_FAILED');
  if (!company.emailDraft) throw new AppError('Taslak yok.', 'SEND_FAILED');

  const mime = buildMimeMessage({
    to,
    subject: company.emailDraft.subject,
    body: company.emailDraft.body,
    // From başlığı yazılmaz: Gmail oturum açan hesabın adresini kullanır.
    attachment: cv ? { filename: cv.name, mimeType: cv.type, base64: cv.base64 } : undefined,
  });
  const accessToken = await getGmailToken(config.googleClientId);
  return sendGmailMessage(mime, accessToken, signal);
}
