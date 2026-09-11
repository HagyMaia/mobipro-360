'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Brand/Logo';

export default function WelcomeScreen() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-hidden select-none">
      {/* Background executivo com carro de luxo à noite e overlay gradiente idêntico ao app de passageiro */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 opacity-40"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'), url('/images/taxi-bg.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-[#070D18]/70 to-[#070D18]/80 pointer-events-none" />

      {/* HEADER: Ícone Amarelo de Navegação + SR LOGÍSTICA + Botão Entrar */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-10 pb-4">
        <Logo size="md" lightText subtitle="MOTORISTA" />

        <Link
          href="/login"
          className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs px-5 py-2 rounded-full backdrop-blur-md transition border border-white/10"
        >
          Entrar
        </Link>
      </header>

      {/* CONTEÚDO PRINCIPAL (HERO) */}
      <main className="relative z-10 w-full px-6 pb-10 flex-1 flex flex-col justify-end max-w-md mx-auto">
        {/* Badge Mobilidade Executiva & Corporativa */}
        <div className="inline-flex items-center gap-2 self-start bg-[#F59E0B]/15 border border-[#F59E0B]/40 px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-xs font-bold text-[#F59E0B]">
            Mobilidade Executiva & Corporativa
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight mb-3">
          Sua viagem<br />
          executiva em<br />
          Manaus.
        </h1>

        {/* Subtítulo */}
        <p className="text-xs sm:text-sm text-slate-300 max-w-xs leading-relaxed mb-8">
          Corridas corporativas e particulares com conforto, pontualidade e segurança 24h.
        </p>

        {/* BOTÕES DE AÇÃO: Começar Agora + Já tenho uma conta */}
        <div className="w-full space-y-3">
          <Link
            href="/cadastro"
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl shadow-amber-500/25 transition duration-200"
          >
            <span>Começar Agora</span>
            <ArrowRight size={18} strokeWidth={2.8} />
          </Link>

          <Link
            href="/login"
            className="w-full bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center text-sm border border-white/10 backdrop-blur-md transition duration-200"
          >
            Já tenho uma conta
          </Link>
        </div>
      </main>
    </div>
  );
}