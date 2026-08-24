"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, CarTaxiFront, Info } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('E-mail ou senha incorretos.');
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
        setError('Seu cadastro está em análise pela base. Aguarde a aprovação.');
      } else if (motorista.status === 'Reprovado') {
        await supabase.auth.signOut();
        setError('Seu cadastro foi reprovado. Entre em contato com o suporte.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0B141A] text-white font-sans overflow-hidden">
      {/* Imagem de Fundo (Táxi) com Gradiente Escuro */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&q=80&w=1000')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B141A]/80 via-[#0B141A]/90 to-[#0B141A] pointer-events-none" />

      {/* Topo: Logo e Ajuda */}
      <header className="relative z-10 flex justify-between items-center p-6 pt-10">
        <Link href="/welcome" className="flex items-center gap-2 text-blue-400 hover:opacity-80 transition">
          <ArrowLeft size={22} className="text-white" />
          <CarTaxiFront size={28} strokeWidth={1.5} />
          {/* Substitua esta linha no <header>: */}
          <span className="font-extrabold text-white text-lg tracking-wide">SR <span className="text-blue-500">Logística</span></span>
        </Link>

        <button className="flex items-center gap-1.5 text-white font-medium text-sm hover:text-blue-300 transition-colors">
          Ajuda <HelpCircle size={18} className="text-slate-300" />
        </button>
      </header>

      {/* Formulário Central Translúcido */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 my-auto max-w-md w-full mx-auto">
        <div className="bg-[#0B141A]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1 text-white">Bem-vindo de volta</h1>
            <p className="text-slate-400 text-sm">Insira suas credenciais para acessar o app.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-[#1F2C34]/80 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <Link href="/recuperar-senha" className="text-xs text-blue-400 hover:text-blue-300 transition">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-[#1F2C34]/80 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white mt-2 py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs">
              Ainda não tem conta?{' '}
              <Link href="/cadastro" className="text-blue-400 font-bold hover:text-blue-300 transition">
                Criar uma conta
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé: Versão e Faixa de Atualização */}
      <footer className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center text-slate-400 text-xs mb-3">
          Versão 3.42.00
        </div>

        <div className="w-full bg-[#A832A8] p-4 flex items-center gap-3 cursor-pointer hover:bg-[#8F298F] transition-colors">
          <div className="bg-white rounded-full p-0.5 shrink-0">
            <Info size={14} className="text-[#A832A8]" strokeWidth={3} />
          </div>
          <p className="text-white text-xs font-medium leading-tight">
            Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
          </p>
        </div>
      </footer>
    </div>
  );
}