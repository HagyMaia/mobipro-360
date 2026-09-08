// src/app/atualizar-senha/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AtualizarSenha() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Falha ao atualizar a senha. O link pode ter expirado.');
      }

      setMessage('Sua senha foi redefinida com sucesso! Você já pode acessar o aplicativo.');
    } catch (err: any) {
      console.error('[AtualizarSenha] Erro:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar sua senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#070D18] text-white p-6 font-sans">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
            <Lock size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1 text-white">Criar Nova Senha</h1>
        <p className="text-slate-400 text-xs text-center mb-6">
          Defina sua nova senha para voltar a acessar o MobiPro.
        </p>

        {message ? (
          <div className="space-y-4 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm text-emerald-300 font-medium">{message}</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 text-sm flex items-center justify-center gap-2"
            >
              Ir para o Login <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirme a Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-brand/20 mt-2"
            >
              {loading ? 'Salvando...' : 'Atualizar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
