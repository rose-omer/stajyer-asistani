import { logger } from './logger';

/**
 * localStorage sarmalayıcısı. Gizli pencere, dolu kota ya da engelli depoda atmaz.
 * Yalnız küçük tercihler ve demo verisi yazılır; CV yazılmaz.
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    logger.warn('storage read failed', key, error);
    return fallback;
  }
}

/** Yazma başarısızsa false döner (ör. QuotaExceededError). */
export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn('storage write failed', key, error);
    return false;
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    logger.warn('storage write failed', key, error);
  }
}

export const KEYS = {
  profile: 'stajyer_profile',
  companies: 'stajyer_companies',
  logs: 'stajyer_logs',
  settings: 'stajyer_settings',
  theme: 'stajyer_theme',
  consent: 'stajyer_consent_v1',
} as const;
