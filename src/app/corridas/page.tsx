"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/lib/store';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function CorridasPage() {
  const { state } = useApp();
  const [previewMounted, setPreviewMounted] = useState(false);

  useEffect(() => setPreviewMounted(true), []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[color:var(--bg)]">
      <div className="absolute inset-0">
        <DriverMap location={null} />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col justify-start p-4 pointer-events-none">
        <div className="mx-auto w-full max-w-md pointer-events-auto">
          <Card className={`rounded-2xl p-3 shadow-xl transition-all ${previewMounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Corridas</div>
                <div className="text-xs text-slate-500">Sua atividade recente</div>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">{state.rideHistory.length}</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto p-4">
        <div className="mx-auto max-w-md">
          <div className="grid gap-3">
            <Button full>Iniciar Turno</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
