'use client';

import React from 'react';
import { X, Navigation, ExternalLink } from 'lucide-react';
import { openWaze, openGoogleMaps, NavCoordinates } from '@/lib/navigation';
import { useApp } from '@/lib/store';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  coords?: NavCoordinates | null;
  destinationLabel?: string;
}

export function NavigationModal({
  isOpen,
  onClose,
  address,
  coords,
  destinationLabel = 'Destino'
}: NavigationModalProps) {
  const { dispatch } = useApp();

  if (!isOpen) return null;

  const handleOpenWaze = () => {
    dispatch({ type: 'SET_NAV_APP', navApp: 'waze' });
    openWaze(address, coords);
    onClose();
  };

  const handleOpenGmaps = () => {
    dispatch({ type: 'SET_NAV_APP', navApp: 'gmaps' });
    openGoogleMaps(address, coords);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/20 text-brand-700 dark:text-brand">
              <Navigation size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Escolha o Navegador</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Navegar até {destinationLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/60 p-3 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Endereço selecionado:</span>
          <span className="line-clamp-2">{address || 'Endereço da corrida'}</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Opção Waze */}
          <button
            onClick={handleOpenWaze}
            className="flex items-center justify-between rounded-2xl border-2 border-sky-400/40 bg-sky-50 dark:bg-sky-950/40 p-3.5 transition hover:bg-sky-100 dark:hover:bg-sky-900/60 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white font-black text-sm shadow-md shadow-sky-500/25">
                Waze
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-900 dark:text-white">Waze GPS</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Rotas e alertas de trânsito ao vivo</div>
              </div>
            </div>
            <ExternalLink size={16} className="text-sky-500 shrink-0" />
          </button>

          {/* Opção Google Maps */}
          <button
            onClick={handleOpenGmaps}
            className="flex items-center justify-between rounded-2xl border-2 border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-600/25">
                Maps
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-900 dark:text-white">Google Maps</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Navegação detalhada passo a passo</div>
              </div>
            </div>
            <ExternalLink size={16} className="text-emerald-500 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
