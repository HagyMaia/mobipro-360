'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Home,
  MapPin,
  Navigation,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Building,
  Plane,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import type { DestinationFilter } from '@/lib/types';

interface DestinationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: 'Minha Casa', icon: Home, defaultAddress: 'Minha Residência' },
  { label: 'Centro Histórico', icon: Building, defaultAddress: 'Centro, Manaus - AM' },
  { label: 'Adrianópolis / Vieiralves', icon: Building, defaultAddress: 'Adrianópolis, Manaus - AM' },
  { label: 'Zona Norte (Cidade Nova)', icon: MapPin, defaultAddress: 'Cidade Nova, Manaus - AM' },
  { label: 'Ponta Negra / Orla', icon: MapPin, defaultAddress: 'Ponta Negra, Manaus - AM' },
  { label: 'Aeroporto Eduardo Gomes', icon: Plane, defaultAddress: 'Aeroporto Internacional Eduardo Gomes' },
];

const FAVORITE_HOME_KEY = 'mobipro_fav_home_address_v1';

export function DestinationFilterModal({ isOpen, onClose }: DestinationFilterModalProps) {
  const { state, dispatch } = useApp();

  const currentFilter = state.destinationFilter;
  const [isEnabled, setIsEnabled] = useState(Boolean(currentFilter?.enabled));
  const [address, setAddress] = useState(currentFilter?.address || '');
  const [label, setLabel] = useState(currentFilter?.label || 'Minha Casa');
  const [maxDeviationKm, setMaxDeviationKm] = useState<number>(currentFilter?.maxDeviationKm || 5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentFilter) {
      setIsEnabled(currentFilter.enabled);
      setAddress(currentFilter.address);
      setLabel(currentFilter.label || 'Minha Casa');
      setMaxDeviationKm(currentFilter.maxDeviationKm || 5);
    } else {
      const savedHome = typeof window !== 'undefined' ? localStorage.getItem(FAVORITE_HOME_KEY) : null;
      if (savedHome) {
        setAddress(savedHome);
      }
    }
  }, [currentFilter, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setLabel(preset.label);
    if (preset.label === 'Minha Casa') {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(FAVORITE_HOME_KEY) : null;
      setAddress(saved || 'Minha Casa');
    } else {
      setAddress(preset.defaultAddress);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isEnabled) {
      dispatch({ type: 'SET_DESTINATION_FILTER', filter: null });
      onClose();
      return;
    }

    if (!address.trim()) return;

    if (label === 'Minha Casa' && typeof window !== 'undefined') {
      localStorage.setItem(FAVORITE_HOME_KEY, address.trim());
    }

    const newFilter: DestinationFilter = {
      enabled: true,
      address: address.trim(),
      label: label.trim(),
      maxDeviationKm: Number(maxDeviationKm),
    };

    dispatch({ type: 'SET_DESTINATION_FILTER', filter: newFilter });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleDisable = () => {
    setIsEnabled(false);
    dispatch({ type: 'SET_DESTINATION_FILTER', filter: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-2xl overflow-hidden">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/20 text-brand-700 dark:text-brand">
              <Compass size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Destino Definido
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtre corridas na rota do seu retorno (&quot;A Caminho de Casa&quot;)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TOGGLE ATIVAÇÃO */}
          <div
            onClick={() => setIsEnabled(!isEnabled)}
            className={`cursor-pointer flex items-center justify-between rounded-2xl p-4 border transition ${
              isEnabled
                ? 'bg-brand/10 border-brand text-slate-900 dark:text-white'
                : 'bg-slate-50 dark:bg-dark-800/60 border-slate-200/80 dark:border-dark-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isEnabled ? 'bg-brand text-slate-950 font-black' : 'bg-slate-200 dark:bg-dark-700 text-slate-500'
                }`}
              >
                <Navigation size={20} />
              </div>
              <div>
                <div className="text-xs font-black">
                  {isEnabled ? 'Filtro de Destino ATIVADO' : 'Filtro de Destino DESATIVADO'}
                </div>
                <div className="text-[11px] opacity-80">
                  {isEnabled
                    ? 'Recebendo apenas corridas na direção escolhida'
                    : 'Recebendo todas as corridas da cidade normalmente'}
                </div>
              </div>
            </div>
            {isEnabled ? (
              <ToggleRight size={32} className="text-brand shrink-0" />
            ) : (
              <ToggleLeft size={32} className="text-slate-400 shrink-0" />
            )}
          </div>

          {/* PRESETS RÁPIDOS */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Escolha rápida ou favorita:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = label === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      handleApplyPreset(p);
                      setIsEnabled(true);
                    }}
                    className={`flex items-center gap-2 rounded-2xl border p-2.5 text-left text-xs font-bold transition ${
                      isSelected
                        ? 'border-brand bg-brand/15 text-brand-800 dark:text-brand'
                        : 'border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} className="shrink-0 text-brand" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPO DE ENDEREÇO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Endereço / Ponto de Referência do seu Destino
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3 text-brand" />
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setIsEnabled(true);
                }}
                placeholder="Ex: Rua São Luís, Adrianópolis ou Bairro Alvorada"
                className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* RAIO MÁXIMO DE DESVIO */}
          <div className="space-y-2 rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders size={14} className="text-brand" /> Desvio máximo permitido:
              </span>
              <strong className="font-black text-brand-700 dark:text-brand">{maxDeviationKm} km</strong>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={maxDeviationKm}
              onChange={(e) => setMaxDeviationKm(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Rota mais estrita (2 km)</span>
              <span>Rota flexível (15 km)</span>
            </div>
          </div>

          {/* AVISO EXPLICATIVO */}
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-[11px] text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <span>
              Ao ativar o <strong>Destino Definido</strong>, o app prioriza apenas chamadas cujo trajeto economize seu combustível em direção ao seu ponto final.
            </span>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="border-t border-slate-100 dark:border-dark-800 p-4 flex gap-2">
          {currentFilter?.enabled && (
            <button
              type="button"
              onClick={handleDisable}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20"
            >
              Desativar
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isEnabled && !address.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-xs font-black text-slate-950 shadow-lg shadow-brand/20 hover:brightness-105 disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check size={16} /> Filtro Salvo!
              </>
            ) : isEnabled ? (
              <>
                <Check size={16} /> Ativar Rota Definida
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
