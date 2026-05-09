'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Никаких mounted-проверок — просто пропускаем детей.
  // Класс 'dark' уже выставлен скриптом в <head>.
  return <>{children}</>;
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'light';
    setThemeState(saved);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return { theme, setTheme, toggleTheme };
};