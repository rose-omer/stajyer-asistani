import { useEffect } from 'react';
import type { ThemePreference } from '../types';
import { KEYS, writeString } from './storage';

/** Tema tercihini köke uygular. "system" ise data-theme kaldırılır, CSS medya sorgusu karar verir. */
export function useApplyTheme(theme: ThemePreference): void {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    writeString(KEYS.theme, theme === 'system' ? null : theme);
  }, [theme]);
}
