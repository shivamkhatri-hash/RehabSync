import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'posecare-theme';

export const ThemeContext = createContext(null);

/** Saved choice wins; otherwise follow the operating-system preference. */
export function resolveInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage blocked — fall through to the system preference */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Reads the active theme and exposes `setTheme` / `toggleTheme`.
 * Must be called inside <ThemeProvider> (see src/hooks/ThemeProvider.jsx).
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a <ThemeProvider>');
  return context;
}
