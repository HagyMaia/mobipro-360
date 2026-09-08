// src/components/Auth/GlobalPasswordResetModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalPasswordResetModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Escuta evento do Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsOpen(true);
      }
    });

    // 2. Verifica hash da URL ou parâmetros de busca
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      
      const isRecovery =
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        search.includes('type=recovery') ||
        search.includes('mode=reset');

      if (isRecovery) {
        setIsOpen(true);
      }
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
        throw new Error(updateError.message || 'O link de recuperação expirou. Solicite um novo link.');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('[GlobalPasswordReset] Erro ao salvar nova senha:', err);
      setError(err.message || 'Não foi possível redefinir sua senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsOpen(false);
    setSuccess(false);
    setNewPassword('');
    setConfirmPassword('');
    
    // Limpa a URL de tokens de recuperação
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0D1624] border border-amber-500/30 p-6 rounded-3xl shadow-2xl space-y-4 text-white font-sans">
        {/* Botão Fechar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Criar Nova Senha</h3>
            <p className="text-xs text-slate-400">Defina sua nova credencial de acesso</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Senha alterada com sucesso!</h4>
                <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                  Sua conta já está atualizada com a nova senha. Você pode entrar no aplicativo agora.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="w-full bg-amber-500 text-slate-950 font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-amber-500/20 text-sm"
            >
              Acessar o Aplicativo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Digite e confirme sua nova senha abaixo para voltar a acessar o MobiPro.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 p-3.5 pr-11 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirme a Nova Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm transition"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3 rounded-xl transition text-sm border border-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 text-slate-950 font-bold py-3 rounded-xl hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-amber-500/20"
              >
                {loading ? 'Salvando...' : 'Salvar Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
