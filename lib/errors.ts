export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'MODEL_OUTPUT_INVALID'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR'
  | 'ABORTED'
  | 'SEND_FAILED'
  | 'SEND_DISABLED'
  | 'QUOTA_REACHED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const USER_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Oturumunuz kapandı. Yeniden giriş yapın.',
  RATE_LIMITED: 'Bugünkü yapay zeka istek sınırına ulaştınız. Yarın yeniden deneyin.',
  VALIDATION_ERROR: 'Gönderilen bilgiler eksik ya da hatalı. Alanları denetleyin.',
  MODEL_OUTPUT_INVALID: 'Yapay zeka beklenen biçimde yanıt vermedi. Yeniden deneyin.',
  UPSTREAM_ERROR: 'Yapay zeka servisine ulaşılamadı. Biraz sonra yeniden deneyin.',
  NETWORK_ERROR: 'Bağlantı kurulamadı. İnternet bağlantınızı denetleyin.',
  ABORTED: 'İşlem durduruldu.',
  SEND_FAILED: 'Mail gönderilemedi.',
  SEND_DISABLED: 'Bu modda gönderim kapalı.',
  QUOTA_REACHED: 'Bugünkü gönderim sınırına ulaştınız.',
  INTERNAL_ERROR: 'Beklenmeyen bir hata oluştu. Yeniden deneyin.',
};

export function isAbort(error: unknown): boolean {
  return (
    (error instanceof AppError && error.code === 'ABORTED') ||
    (error instanceof DOMException && error.name === 'AbortError')
  );
}

/** Kullanıcıya gösterilecek metin. Teknik ayrıntı dışarı sızmaz. */
export function userMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.code === 'SEND_FAILED' || error.code === 'QUOTA_REACHED'
      ? error.message
      : USER_MESSAGES[error.code];
  }
  if (isAbort(error)) return USER_MESSAGES.ABORTED;
  if (error instanceof TypeError) return USER_MESSAGES.NETWORK_ERROR;
  return USER_MESSAGES.INTERNAL_ERROR;
}
