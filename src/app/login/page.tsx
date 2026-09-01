"use client";
import React, { useState } from 'react';
import { supabase, browserUrl } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, CarTaxiFront, Info, Download } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { ProfileService } from '@/services/driver/ProfileService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[Login] tente login', { email });
    console.log('[Login] supabase url', browserUrl);

    let authData: any = null;
    let authError: any = null;

    try {
      try {
        const res = await supabase.auth.signInWithPassword({ email, password });
        authData = res.data;
        authError = res.error;
        console.log('[Login] signInWithPassword result', { authData, authError });
      } catch (e) {
        console.error('[Login] signInWithPassword threw', e);
        throw e;
      }

      if (authError || !authData?.user) {
        throw new Error(authError?.message || 'E-mail ou senha incorretos.');
      }

      const { data: motorista, error: dbError } = await supabase
        .from('motoristas')
        .select('status')
        .eq('id', authData.user.id)
        .maybeSingle();
      console.log('[Login] motorista query result', { motorista, dbError });

      if (dbError) {
        throw new Error('Não foi possível carregar seu cadastro. Confirme se a tabela motoristas e suas políticas RLS foram criadas no Supabase.');
      }

      if (!motorista) {
        await supabase.auth.signOut();
        setError('Sua conta existe, mas o cadastro de motorista não foi encontrado. Faça o cadastro novamente ou procure o suporte.');
        return;
      }

      const normalizedStatus = ProfileService.normalizeDriverStatus(motorista.status);

      if (normalizedStatus === 'Aprovado') {
        window.location.href = '/';
      } else if (normalizedStatus === 'Pendente') {
        await supabase.auth.signOut();
        setError('Seu cadastro está em análise pela base. Aguarde a aprovação.');
      } else if (normalizedStatus === 'Reprovado') {
        await supabase.auth.signOut();
        setError('Seu cadastro foi reprovado. Entre em contato com o suporte.');
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-hidden">
      {/* Fundo estilizado com destaque da marca (gradiente + overlay) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 10%, rgba(224,184,0,0.06), transparent 10%), linear-gradient(180deg, rgba(224,184,0,0.06) 0%, rgba(11,18,36,var(--login-gradient-opacity)) 100%)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B141A]/75 via-[#0B141A]/88 to-[#0B141A] pointer-events-none" />

      {/* Topo: Logo e Ajuda */}
      <header className="relative z-10 flex justify-between items-center p-6 pt-10">
        <Link href="/welcome" className="flex items-center gap-2 text-brand hover:opacity-80 transition">
          <ArrowLeft size={22} className="text-[color:var(--text)] dark:text-white" />
          <CarTaxiFront size={28} strokeWidth={1.5} />
          <span className="font-extrabold text-[color:var(--text)] dark:text-white text-lg tracking-wide">SR <span className="text-brand">Logística</span></span>
        </Link>

        <button onClick={() => setSupportOpen(true)} className="flex items-center gap-1.5 text-[color:var(--text)] dark:text-white font-medium text-sm hover:text-brand-300 transition-colors">
          Ajuda <HelpCircle size={18} className="text-slate-300" />
        </button>
      </header>

      {/* Formulário Central Translúcido */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 my-auto max-w-md w-full mx-auto">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1 text-[color:var(--text)] dark:text-white">Bem-vindo de volta</h1>
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
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-[color:var(--text)] dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <Link href="/recuperar-senha" className="text-xs text-brand hover:text-brand-300 transition">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-[color:var(--text)] dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-[color:var(--text)] dark:text-white mt-2 py-4 rounded-2xl font-extrabold text-lg hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-brand/30"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-5">
            <p className="text-slate-400 text-xs">
              Ainda não tem conta?{' '}
              <Link href="/cadastro" className="text-brand font-bold hover:text-brand-300 transition">
                Criar uma conta
              </Link>
            </p>

            {/* BOTÃO DE DOWNLOAD DO APK AQUI */}
            <div className="pt-5 border-t border-white/10 flex justify-center">
              <a
                href="/sr-logistica.apk"
                download
                className="flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 text-[color:var(--text)] dark:text-white py-3 px-6 rounded-full transition-all border border-white/10 active:scale-95"
              >
                <Download size={18} className="text-green-400" />
                Baixar App para Android
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé: Versão e Faixa de Atualização */}
      <footer className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center text-slate-400 text-xs mb-3">
          Versão 3.42.00
        </div>

          <div className="w-full bg-[#A832A8] p-4 flex items-center gap-3 cursor-pointer hover:bg-[#962896] active:bg-[#852385] transition-colors shadow-inner">
          <div className="bg-white rounded-full p-0.5 shrink-0">
            <Info size={14} className="text-[#A832A8]" strokeWidth={3} />
          </div>
          <p className="text-[color:var(--text)] dark:text-white text-xs font-medium leading-tight">
            Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
          </p>
        </div>
      </footer>
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
