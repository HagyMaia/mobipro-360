'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const active = root.classList.contains('dark');
    setDark(active);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !dark;

    root.classList.toggle('dark', nextDark);
    root.classList.toggle('light', !nextDark);
    localStorage.setItem('sr-theme', nextDark ? 'dark' : 'light');
    setDark(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-white transition-colors hover:bg-black/20 dark:hover:bg-white/20"
      aria-label="Alternar modo escuro"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
