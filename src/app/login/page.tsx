"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, CarTaxiFront, Info, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  const fillDemo = () => {
    setEmail('motorista@mobipro.com');
    setPassword('123456');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Tenta autenticação real com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        // Se falhar ou se for modo demo/local offline:
        if (email.includes('demo') || email.includes('teste') || email === 'motorista@mobipro.com') {
          // Permite entrada no modo simulador/demo
          window.location.href = '/';
          return;
        }
        throw new Error('E-mail ou senha incorretos. Verifique seus dados.');
      }

      const { data: motorista, error: dbError } = await supabase
        .from('motoristas')
        .select('status')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (dbError || !motorista) {
        window.location.href = '/';
        return;
      }

      if (motorista.status === 'Aprovado') {
        window.location.href = '/';
      } else if (motorista.status === 'Pendente') {
        await supabase.auth.signOut();
        setError('Seu cadastro está em análise pela base. Aguarde a liberação.');
      } else if (motorista.status === 'Reprovado') {
        await supabase.auth.signOut();
        setError('Seu cadastro foi reprovado. Entre em contato com o suporte.');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-hidden select-none">
      {/* Imagem de Fundo (Táxi Branco) com Gradiente Escuro */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105"
        style={{ backgroundImage: "url('/images/white-taxi.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/90 via-[#070D18]/80 to-[#070D18] pointer-events-none" />

      {/* Topo: Logo e Ajuda */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-10 pb-4">
        <Link href="/welcome" className="flex items-center gap-2.5 hover:opacity-80 transition group">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition">
            <ArrowLeft size={18} />
          </div>
          <div className="flex items-center gap-2">
            <CarTaxiFront size={22} className="text-blue-400" />
            <span className="font-extrabold text-white text-lg tracking-tight">
              MobiPro<span className="text-blue-500">360</span>
            </span>
          </div>
        </Link>

        <button 
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-1.5 text-white/90 bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 rounded-full font-medium text-xs border border-white/15 transition backdrop-blur-md"
        >
          <span>Ajuda</span>
          <HelpCircle size={15} className="text-blue-300" />
        </button>
      </header>

      {/* Formulário Central Translúcido */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4 max-w-md w-full mx-auto">
        <div className="bg-[#0D1826]/85 backdrop-blur-2xl border border-white/15 p-6 rounded-3xl shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black mb-1 text-white tracking-tight">Acesse sua conta</h1>
            <p className="text-slate-400 text-xs">Informe seu e-mail e senha cadastrados no sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-2xl text-xs text-center font-semibold animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-400" />
                E-mail do Motorista
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="bg-[#08101C]/90 border border-white/15 p-3.5 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-blue-400" />
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => alert("Entre em contato com o suporte para redefinir sua senha.")}
                  className="text-xs text-blue-400 hover:text-blue-300 transition font-medium"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#08101C]/90 border border-white/15 p-3.5 pr-11 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botão de Preenchimento Rápido / Demo */}
            <button
              type="button"
              onClick={fillDemo}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-600/25 transition"
            >
              <Sparkles size={14} className="text-blue-400" />
              Preencher dados de teste (Demo)
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 active:bg-blue-700 text-white mt-2 py-4 rounded-2xl font-extrabold text-base hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30 active:scale-[0.98]"
            >
              {loading ? 'Validando acesso...' : 'Entrar no Aplicativo'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-400 text-xs">
              Ainda não possui cadastro?{' '}
              <Link href="/cadastro" className="text-blue-400 font-extrabold hover:text-blue-300 transition underline underline-offset-2">
                Cadastrar Conta
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé: Versão e Faixa de Atualização */}
      <footer className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center text-slate-400 text-xs mb-3 font-medium">
          Versão 1.0.0 (Build 342)
        </div>

        <div className="w-full bg-[#A832A8] p-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#962896] transition-colors">
          <div className="bg-white rounded-full p-1 shrink-0 flex items-center justify-center">
            <Info size={13} className="text-[#A832A8]" strokeWidth={3.5} />
          </div>
          <p className="text-white text-xs font-semibold leading-tight flex-1">
            Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
          </p>
        </div>
      </footer>

      {/* Modal de Suporte */}
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}