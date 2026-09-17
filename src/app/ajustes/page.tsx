'use client';

import React, { useState, useEffect } from 'react';
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
  Download,
  Fingerprint
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Card, SectionTitle, Badge, Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { BiometricAuthService } from '@/services/auth/BiometricAuthService';
import { ProfileService } from '@/services/driver/ProfileService';

export default function AjustesPage() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const navApp = state.navApp ?? 'waze';
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoReject, setAutoReject] = useState(state.filters.autoReject);
  const [rejectCash, setRejectCash] = useState(state.filters.rejectCash);
  const [minRating, setMinRating] = useState(state.filters.minRating);

  // Categoria Operacional (Definida exclusivamente pelo Admin)
  const currentDriverType = state.profile?.driverType || (
    typeof window !== 'undefined' ? (window.localStorage.getItem('mobipro_driver_type') as 'EMPRESA' | 'PARTICULAR') || 'PARTICULAR' : 'PARTICULAR'
  );
  const [driverType, setDriverType] = useState<'EMPRESA' | 'PARTICULAR'>(currentDriverType);

  useEffect(() => {
    if (state.profile?.driverType) {
      setDriverType(state.profile.driverType);
    }
  }, [state.profile?.driverType]);

  // Estados de Biometria
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState('');

  useEffect(() => {
    BiometricAuthService.isBiometricAvailable().then((avail) => {
      setBiometricAvailable(avail);
      if (avail) {
        setBiometricEnabled(BiometricAuthService.isBiometricEnrolled());
      }
    });
  }, []);

  const handleToggleBiometrics = async () => {
    setBiometricMsg('');
    if (biometricEnabled) {
      BiometricAuthService.disableBiometrics();
      setBiometricEnabled(false);
      setBiometricMsg('Entrada por digital desativada.');
      setTimeout(() => setBiometricMsg(''), 3000);
    } else {
      if (!user) {
        setBiometricMsg('Faça login para cadastrar sua digital.');
        return;
      }
      const res = await BiometricAuthService.registerBiometrics({
        email: user.email || 'motorista@srlogistica.com',
        userId: user.id,
      });
      if (res.success) {
        setBiometricEnabled(true);
        setBiometricMsg('Digital cadastrada com sucesso!');
        setTimeout(() => setBiometricMsg(''), 3000);
      } else {
        setBiometricMsg(res.error || 'Falha ao cadastrar digital.');
        setTimeout(() => setBiometricMsg(''), 4000);
      }
    }
  };

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
        {/* CATEGORIA DO MOTORISTA (DEFINIDA EXCLUSIVAMENTE PELO ADMINISTRADOR) */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Categoria Operacional do Motorista
          </SectionTitle>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Modalidade de Atendimento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Definida exclusivamente pela administração central da frota
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 px-2.5 py-0.5 rounded-full">
                Fixada pela Central
              </span>
            </div>

            {/* Renderização Exclusiva: Se Particular, Empresa NÃO aparece. Se Empresa, Particular NÃO aparece. */}
            {driverType === 'EMPRESA' ? (
              <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <span className="text-sm font-black text-teal-700 dark:text-teal-400">
                      Motorista Empresa
                    </span>
                  </div>
                  <span className="bg-teal-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    Atribuído
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Habilitado exclusivamente para receber <strong>corridas em voucher corporativo</strong> de empresas conveniadas com repasse integral (100% repasse, taxa 0%).
                </p>
                <div className="pt-2 border-t border-teal-500/20 text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Apenas o administrador pode alterar sua categoria no painel central.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚗</span>
                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                      Motorista Particular
                    </span>
                  </div>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    Atribuído
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Habilitado para receber <strong>corridas particulares</strong> (taxa de retenção de 20%) e <strong>corridas em voucher corporativo</strong>.
                </p>
                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Apenas o administrador pode alterar sua categoria no painel central.</span>
                </div>
              </div>
            )}
          </Card>
        </div>
        {/* SEGURANÇA & BIOMETRIA (DIGITAL DO CELULAR) */}
        <div>
          <SectionTitle className="mb-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            Segurança e Acesso Rápido
          </SectionTitle>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand/15 text-brand-700 dark:text-brand flex items-center justify-center shrink-0">
                  <Fingerprint size={22} className={biometricEnabled ? "text-emerald-500 animate-pulse" : ""} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Entrar com Digital / Biometria
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acesse o aplicativo com 1 toque no leitor biométrico
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={handleToggleBiometrics}
                disabled={!biometricAvailable}
                className="w-5 h-5 accent-brand rounded cursor-pointer"
              />
            </div>

            {biometricMsg && (
              <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-xs font-bold text-brand-700 dark:text-brand text-center animate-in fade-in">
                {biometricMsg}
              </div>
            )}

            {!biometricAvailable && (
              <div className="text-[11px] text-slate-400 bg-slate-100 dark:bg-dark-800 p-2.5 rounded-xl">
                ⚠️ O leitor biométrico não foi detectado neste navegador ou aparelho.
              </div>
            )}
          </Card>
        </div>

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
                  Aceitar apenas PIX e Voucher Corporativo
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
          <p className="mt-0.5">Versão 1.0.0 (Build 342) · Biometria WebAuthn Ativa</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Compatível com Biometria Android, Touch ID, Face Unlock e PWA</p>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
