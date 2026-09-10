'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Download,
  Zap,
  Building2,
  Compass,
  CheckCircle2,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';

export default function WelcomeScreen() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      window.location.href = '/sr-logistica.apk';
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-x-hidden select-none">
      {/* Background com fotografia e overlay escuro de alto contraste */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 opacity-30"
        style={{ backgroundImage: "url('/images/white-taxi.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/95 via-[#070D18]/85 to-[#070D18] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* HEADER: Logomarca Oficial + Status Operacional + Ajuda */}
      <header className="relative z-10 flex justify-between items-center px-5 pt-8 pb-3 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand/30 to-brand/10 border border-brand/50 backdrop-blur-xl flex items-center justify-center text-brand shadow-lg shadow-brand/15">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-lg tracking-tight leading-none">
                SR <span className="text-brand">Logística</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
              Central do Motorista
            </span>
          </div>
        </div>

        {/* Botão de Suporte Oficial */}
        <button
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-1.5 text-slate-200 bg-white/5 hover:bg-white/10 active:scale-95 px-3 py-1.5 rounded-full font-semibold text-xs border border-white/10 transition-all shadow-sm backdrop-blur-md"
        >
          <HelpCircle size={15} className="text-brand" />
          <span>Suporte</span>
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL: Hero + Pilares Corporativos */}
      <main className="relative z-10 w-full px-5 py-6 flex-1 flex flex-col justify-center max-w-md mx-auto">
        {/* Status Operacional da Central */}
        <div className="inline-flex items-center gap-2 self-start bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full mb-5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-emerald-400 tracking-wide">
            Central Operacional Ativa 24h
          </span>
        </div>

        {/* Título & Proposta de Valor */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Mobilidade profissional com rentabilidade real.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Acesse a central integrada de corridas corporativas, fretamentos e rotas otimizadas com repasse imediato.
          </p>
        </div>

        {/* Cards de Benefícios / Pilares */}
        <div className="space-y-2.5 mb-7">
          <div className="bg-white/[0.04] border border-white/10 hover:border-brand/40 p-3.5 rounded-2xl flex items-center gap-3.5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white">Repasse Imediato via PIX</h3>
              <p className="text-[11px] text-slate-400 truncate">Sem taxas abusivas, extrato em tempo real.</p>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 hover:border-emerald-500/40 p-3.5 rounded-2xl flex items-center gap-3.5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white">Corridas Corporativas & Fretamento</h3>
              <p className="text-[11px] text-slate-400 truncate">Passageiros e empresas validados pela central.</p>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 hover:border-sky-500/40 p-3.5 rounded-2xl flex items-center gap-3.5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Compass size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white">Despacho & Radar Inteligente</h3>
              <p className="text-[11px] text-slate-400 truncate">Mais corridas nas regiões de maior demanda.</p>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO (CTAs) */}
        <div className="w-full space-y-3">
          {/* Botão Primário: Entrar na Minha Conta */}
          <Link
            href="/login"
            className="group flex items-center justify-between w-full bg-brand text-slate-950 py-4 px-6 rounded-2xl font-black text-base shadow-xl shadow-brand/20 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
          >
            <span>Entrar na Minha Conta</span>
            <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center text-slate-950 group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} strokeWidth={2.8} />
            </div>
          </Link>

          {/* Botão Secundário: Cadastrar Nova Conta */}
          <Link
            href="/cadastro"
            className="flex items-center justify-between w-full border border-white/15 bg-white/5 text-white py-3.5 px-6 rounded-2xl font-bold text-sm hover:bg-white/10 active:scale-[0.98] transition-all duration-200 shadow-lg backdrop-blur-md"
          >
            <span>Cadastrar como Motorista Parceiro</span>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>

          {/* Opção de Instalação / Download do APK Android */}
          <div className="pt-2">
            <a
              href="/sr-logistica.apk"
              download="sr-logistica.apk"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Baixar Aplicativo Android Direto (APK Oficial)</span>
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER: Selo de Segurança e Termos */}
      <footer className="relative z-10 w-full px-5 py-4 border-t border-white/5 bg-slate-950/60 backdrop-blur-md flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Ambiente Seguro com Criptografia de Ponta a Ponta</span>
        </div>
        <div className="text-[10px] text-slate-400 tracking-wide text-center">
          SR Logística & Transporte © Todos os direitos reservados • v3.42.0
        </div>
      </footer>

      {/* MODAL DE SUPORTE */}
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}