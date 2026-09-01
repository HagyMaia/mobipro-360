"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function PerfilLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100">
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Optional context-aware heading for clarity during navigation */}
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-white">Perfil</h2>
          <p className="text-sm text-slate-400">Gerencie sua conta e veículo</p>
        </div>

        <div className="prose prose-invert">{children}</div>
      </main>
    </div>
  );
}
