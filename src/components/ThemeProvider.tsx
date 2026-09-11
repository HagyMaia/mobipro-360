'use client';

import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('sr-theme') || 'dark';

    if (savedTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    // Garante que o theme-color no Android seja sempre o fundo escuro da marca (#070D18)
    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', '#070D18');

      let metaNavColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
      if (!metaNavColor) {
        metaNavColor = document.createElement('meta');
        metaNavColor.setAttribute('name', 'msapplication-navbutton-color');
        document.head.appendChild(metaNavColor);
      }
      metaNavColor.setAttribute('content', '#070D18');
    } catch (_) {}
  }, []);

  return <>{children}</>;
}

