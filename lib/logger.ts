/* Tek günlük yardımcısı. Üretim paketinde sessizdir; kişisel veri yazılmaz. */
const enabled = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const logger = {
  warn: (...args: unknown[]) => {
    if (enabled) console.warn('[stajyer]', ...args);
  },
  error: (...args: unknown[]) => {
    if (enabled) console.error('[stajyer]', ...args);
  },
};
