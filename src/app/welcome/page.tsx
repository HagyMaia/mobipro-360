'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Info, CarTaxiFront, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';

export default function WelcomeScreen() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [updateToast, setUpdateToast] = useState(false);

  const handleUpdateClick = () => {
    setUpdateToast(true);
    setTimeout(() => setUpdateToast(false), 4000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-hidden select-none">
      {/* IMAGEM DE FUNDO DO TÁXI BRANCO COM COMPOSIÇÃO CINEMATOGRÁFICA */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('/images/white-taxi.jpg')" }}
      />

      {/* GRADIENTE E OVERLAY ESCURO PROFUNDO (Alto contraste e legibilidade impecável) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/85 via-[#070D18]/50 to-[#070D18] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#070D18]/40 to-[#070D18]/90 pointer-events-none" />

      {/* HEADER: LOGO E AJUDA */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-blue-400 shadow-lg">
            <CarTaxiFront size={24} strokeWidth={2} />
          </div>
          <div>
            <span className="font-black text-white text-xl tracking-tight leading-none block">
              MobiPro<span className="text-blue-500">360</span>
            </span>
            <span className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-wider block mt-0.5">
              App do Motorista
            </span>
          </div>
        </div>

        {/* Botão de Ajuda */}
        <button
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-2 text-white/90 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md px-3.5 py-2 rounded-full font-medium text-xs border border-white/15 transition-all shadow-sm"
        >
          <span>Ajuda</span>
          <HelpCircle size={16} className="text-blue-300" />
        </button>
      </header>

      {/* TOAST DE ATUALIZAÇÃO / STATUS */}
      {updateToast && (
        <div className="relative z-30 mx-6 bg-slate-900/95 border border-purple-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-xs text-slate-200">
            <span className="font-bold text-white block">Versão 1.0.0 instalada</span>
            Seu aplicativo já está sincronizado com a central de despacho.
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL VAZIA PARA DESTAQUE DO TÁXI BRANCO */}
      <div className="flex-1 min-h-[140px]" />

      {/* CONTEÚDO PRINCIPAL (BOTÕES CTAs) */}
      <main className="relative z-10 w-full px-6 pb-4">
        {/* Selo de Segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-300/80 mb-4 text-center">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Plataforma oficial com corridas 100% seguras</span>
        </div>

        <div className="w-full space-y-3.5 mb-5">
          {/* Botão Primário: Cadastrar Conta */}
          <Link
            href="/cadastro"
            className="flex items-center justify-between w-full bg-white text-gray-950 py-4 px-6 rounded-2xl font-extrabold text-[17px] shadow-xl hover:bg-slate-100 active:scale-[0.98] transition-all duration-150"
          >
            <span>Cadastrar Conta</span>
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-900">
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          </Link>

          {/* Botão Secundário: Entrar */}
          <Link
            href="/login"
            className="flex items-center justify-between w-full border border-white/80 bg-[#0B141A]/70 backdrop-blur-xl text-white py-4 px-6 rounded-2xl font-extrabold text-[17px] hover:bg-white/10 active:scale-[0.98] transition-all duration-150 shadow-lg"
          >
            <span>Entrar</span>
            <ArrowRight size={20} className="text-white" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Versão do App */}
        <div className="text-center text-slate-400/90 text-xs font-medium tracking-wide">
          Versão 1.0.0 (Build 342)
        </div>
      </main>

      {/* BANNER DE NOTIFICAÇÃO ROXO/MAGENTA CONFORME REFERÊNCIA */}
      <div
        onClick={handleUpdateClick}
        role="button"
        tabIndex={0}
        className="relative z-20 w-full bg-[#A832A8] hover:bg-[#962896] active:bg-[#852385] px-5 py-3.5 flex items-center gap-3 cursor-pointer transition-colors shadow-lg"
      >
        <div className="bg-white rounded-full p-1 shrink-0 flex items-center justify-center shadow-sm">
          <Info size={14} className="text-[#A832A8]" strokeWidth={3.5} />
        </div>
        <p className="text-white text-[13px] font-semibold leading-snug tracking-normal flex-1">
          Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
        </p>
      </div>

      {/* MODAL DE SUPORTE */}
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}