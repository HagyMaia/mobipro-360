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
  CarFront,
  Download
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
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] pb-24 font-sans text-slate-900 dark:text-slate-100 select-none transition-colors">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Ajustes e <span className="text-brand-600 dark:text-brand">Preferências</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Acesso e Dispositivo
          </SectionTitle>
          <Link href="/ajustes/permissoes">
            <Card className="flex items-center justify-between p-4 hover:border-brand/40 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand/15 text-brand-700 dark:text-brand flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand transition">
                    Permissões do App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    GPS 2º plano, Notificações e Sobreposição
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Check size={11} /> Todas Ativas
                </Badge>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            </Card>
          </Link>
        </div>

        {/* NAVEGAÇÃO GPS PREFERIDA */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Navegador GPS Padrão
          </SectionTitle>
          <Card className="p-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_NAV_APP', navApp: 'waze' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-black transition ${
                navApp === 'waze'
                  ? 'bg-brand text-slate-950 shadow-md shadow-brand/20'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
              }`}
            >
              <Navigation size={16} /> Waze GPS
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_NAV_APP', navApp: 'gmaps' })}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-black transition ${
                navApp === 'gmaps'
                  ? 'bg-brand text-slate-950 shadow-md shadow-brand/20'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
              }`}
            >
              <Navigation size={16} /> Google Maps
            </button>
          </Card>
        </div>

        {/* FILTROS DE RENTABILIDADE E CORRIDAS */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Filtros Automáticos de Rentabilidade
          </SectionTitle>
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Auto-Recusar Baixa Rentabilidade</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Descarta chamadas com R$/km abaixo do limite mínimo
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoReject}
                onChange={(e) => handleFilterChange(e.target.checked, rejectCash, minRating)}
                className="w-5 h-5 accent-brand rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-700">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recusar Pagamento em Dinheiro</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aceitar apenas PIX, Cartão e Voucher da Empresa
                </p>
              </div>
              <input
                type="checkbox"
                checked={rejectCash}
                onChange={(e) => handleFilterChange(autoReject, e.target.checked, minRating)}
                className="w-5 h-5 accent-brand rounded cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nota Mínima do Passageiro</h4>
                <span className="text-xs font-black text-brand-700 dark:text-brand">★ {Number(minRating ?? 0).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="4.9"
                step="0.1"
                value={minRating}
                onChange={(e) => handleFilterChange(autoReject, rejectCash, parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* ALERTA SONORO */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Alertas Sonoros
          </SectionTitle>
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Volume2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Alarme de Nova Corrida</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toque com volume máximo ao receber chamadas
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-5 h-5 accent-brand rounded cursor-pointer"
            />
          </Card>
        </div>

        {/* INSTALAÇÃO DO APK ANDROID */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Aplicativo Nativo
          </SectionTitle>
          <a
            href="/sr-logistica.apk"
            download="sr-logistica.apk"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:border-brand/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Download size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand transition">
                  Baixar Aplicativo Android (APK)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instalar versão mais recente no celular
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand transition" />
          </a>
        </div>

        {/* INFORMAÇÕES DE BUILD */}
        <Card className="p-4 bg-slate-100 dark:bg-dark-800/60 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-bold text-slate-900 dark:text-slate-200">SR Logística - App do Motorista</p>
          <p className="mt-0.5">Versão 1.0.0 (Build 342) · Pronto para produção</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Compatível com PWA, Capacitor e React Native Webview</p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
