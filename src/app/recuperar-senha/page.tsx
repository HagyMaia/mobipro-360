'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, CarTaxiFront, CheckCircle2 } from 'lucide-react';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // O Supabase envia o e-mail com o link de recuperação
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });

      if (error) {
        throw new Error('Não foi possível enviar o e-mail. Verifique se o endereço está correto.');
      }

      setMessage('Pronto! Enviamos um link de recuperação para o seu e-mail. Verifique também a caixa de Spam.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B141A] text-white font-sans overflow-hidden">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&q=80&w=1000')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B141A]/80 via-[#0B141A]/90 to-[#0B141A] pointer-events-none" />

      {/* Topo */}
      <header className="relative z-10 p-6 pt-10">
        <Link href="/login" className="flex items-center gap-2 text-blue-400 hover:opacity-80 transition w-fit">
          <ArrowLeft size={22} className="text-white" />
          <span className="text-white font-medium">Voltar para o Login</span>
        </Link>
      </header>

      {/* Formulário Central */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-20 max-w-md w-full mx-auto">
        <div className="flex justify-center mb-8">
          <div className="bg-[#1F2C34]/80 p-4 rounded-full border border-white/10 shadow-lg">
            <CarTaxiFront size={40} className="text-blue-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="bg-[#0B141A]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2 text-white">Recuperar Senha</h1>
            <p className="text-slate-400 text-sm">
              Digite o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
            </p>
          </div>

          {message ? (
            <div className="bg-green-500/10 border border-green-500/40 p-5 rounded-xl text-center flex flex-col items-center gap-3">
              <CheckCircle2 size={32} className="text-green-400" />
              <p className="text-green-400 text-sm font-medium leading-relaxed">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Seu E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-[#1F2C34]/80 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 text-white mt-2 py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-600/30"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}