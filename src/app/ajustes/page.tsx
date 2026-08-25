'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  ShieldCheck, 
  Sliders, 
  Navigation, 
  Bell, 
  Moon, 
  ChevronRight, 
  ArrowLeft, 
  Volume2, 
  Smartphone, 
  Check, 
  Info,
  CarFront
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Card, SectionTitle, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp } from '@/lib/store';

export default function AjustesPage() {
  const { state, dispatch } = useApp();
  const navApp = state.navApp ?? 'waze';
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoReject, setAutoReject] = useState(state.filters.autoReject);
  const [rejectCash, setRejectCash] = useState(state.filters.rejectCash);
  const [minRating, setMinRating] = useState(state.filters.minRating);

  const handleFilterChange = (auto: boolean, cash: boolean, rating: number) => {
    setAutoReject(auto);
    setRejectCash(cash);
    setMinRating(rating);
    dispatch({
      type: 'UPDATE_FILTERS',
      filters: {
        ...state.filters,
        autoReject: auto,
        rejectCash: cash,
        minRating: rating
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 font-sans select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-dark-700 bg-white/90 dark:bg-dark-800/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-700 dark:text-slate-300 hover:bg-gray-200 transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">
                Ajustes e <span className="text-blue-500">Preferências</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personalize o comportamento do aplicativo
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="p-4 space-y-4 flex-1">
        {/* PERMISSÕES DO SISTEMA */}
        <div>
          <SectionTitle className="mb-2 text-xs font-bold text-gray-500 dark:text-slate-400">
            Acesso e Dispositivo
          </SectionTitle>
          <Link href="/ajustes/permissoes">
            <Card className="flex items-center justify-between p-4 hover:border-blue-500/40 transition border group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-400 transition">
                    Permissões do App
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    GPS 2º plano, Notificações e Sobreposição
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400">
                  <Check size={11} /> Todas Ativas
                </Badge>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            </Card>
          </Link>
        </div>

        {/* NAVEGAÇÃO GPS PREFERIDA */}
        <div>
          <SectionTitle className="mb-2 text-xs font-bold text-gray-500 dark:text-slate-400">
            Navegador GPS Padrão
          </SectionTitle>
          <Card className="p-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_NAV_APP', navApp: 'waze' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition ${
                navApp === 'waze'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-700/60 text-gray-700 dark:text-slate-300'
              }`}
            >
              <Navigation size={16} /> Waze GPS
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_NAV_APP', navApp: 'gmaps' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition ${
                navApp === 'gmaps'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-700/60 text-gray-700 dark:text-slate-300'
              }`}
            >
              <Navigation size={16} /> Google Maps
            </button>
          </Card>
        </div>

        {/* FILTROS DE RENTABILIDADE E CORRIDAS */}
        <div>
          <SectionTitle className="mb-2 text-xs font-bold text-gray-500 dark:text-slate-400">
            Filtros Automáticos de Rentabilidade
          </SectionTitle>
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Auto-Recusar Baixa Rentabilidade</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Descarta chamadas com R$/km abaixo do limite mínimo
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoReject}
                onChange={(e) => handleFilterChange(e.target.checked, rejectCash, minRating)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-700">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Recusar Pagamento em Dinheiro</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Aceitar apenas PIX, Cartão e Voucher da Empresa
                </p>
              </div>
              <input
                type="checkbox"
                checked={rejectCash}
                onChange={(e) => handleFilterChange(autoReject, e.target.checked, minRating)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Nota Mínima do Passageiro</h4>
                <span className="text-xs font-extrabold text-blue-400">★ {minRating.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="4.9"
                step="0.1"
                value={minRating}
                onChange={(e) => handleFilterChange(autoReject, rejectCash, parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* ALERTA SONORO */}
        <div>
          <SectionTitle className="mb-2 text-xs font-bold text-gray-500 dark:text-slate-400">
            Alertas Sonoros
          </SectionTitle>
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Volume2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Alarme de Nova Corrida</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Toque com volume máximo ao receber chamadas
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </Card>
        </div>

        {/* INFORMAÇÕES DE BUILD */}
        <Card className="p-4 bg-gray-50 dark:bg-dark-800/40 border text-center text-xs text-gray-500 dark:text-slate-400">
          <p className="font-bold text-gray-900 dark:text-slate-200">MobiPro 360 - Driver Edition</p>
          <p className="mt-0.5">Versão 1.0.0 (Build 342) · Pronto para produção</p>
          <p className="text-[10px] text-slate-500 mt-1">Compatível com PWA, Capacitor e React Native Webview</p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
