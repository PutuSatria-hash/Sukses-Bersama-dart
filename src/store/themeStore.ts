import { useState, useEffect } from 'react';

export type ThemeMode = 'gelap' | 'terang';

const THEME_KEY = 'latih:tema';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'terang') return 'terang';
    return 'gelap';
  } catch {
    return 'gelap';
  }
}

export function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  if (theme === 'gelap') {
    document.documentElement.classList.add('latih-dark');
  } else {
    document.documentElement.classList.remove('latih-dark');
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'gelap' ? 'terang' : 'gelap'));
  };

  return { theme, toggleTheme };
}

