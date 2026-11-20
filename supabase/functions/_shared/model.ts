// Model adının tek kaynağı. Sunucu GEMINI_MODEL gizli değişkeniyle bunu ezer.
// gemini-2.5-flash 2026-12-01'de kapanır; varsayılan gemini-3.5-flash-lite.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function resolveModel(envValue: string | undefined | null): string {
  const value = envValue?.trim();
  return value ? value : DEFAULT_GEMINI_MODEL;
}
