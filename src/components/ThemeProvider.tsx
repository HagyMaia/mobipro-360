'use client';

import * as React from 'react';
import { colors, radii, shadows, font } from '@/lib/design-tokens';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('sr-theme') || 'dark';

    root.classList.toggle('dark', savedTheme === 'dark');
    root.classList.toggle('light', savedTheme === 'light');
    root.style.setProperty('--bg', colors.background);
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--brand', colors.brand);
    root.style.setProperty('--brand-dark', colors.brandDark);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--radius-sm', radii.sm);
    root.style.setProperty('--radius-md', radii.md);
    root.style.setProperty('--radius-lg', radii.lg);
    root.style.setProperty('--shadow-card', shadows.card);
    root.style.setProperty('--font-body', font.body);
  }, []);

  return <>{children}</>;
}
