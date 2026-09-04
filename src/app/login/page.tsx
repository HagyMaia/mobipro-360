"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { supabase, browserUrl, isSupabaseConfigured, createMockSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, CarTaxiFront, Info, Download } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { ProfileService } from '@/services/driver/ProfileService';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    console.log('[Login] Tentando login com:', { email: trimmedEmail });
    console.log('[Login] Supabase URL:', browserUrl, 'Configurado:', isSupabaseConfigured);

    try {
      let authUser: any = null;

      // 1. Tentar autenticação via Supabase
      if (isSupabaseConfigured) {
        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

          if (authError) {
            console.warn('[Login] Supabase auth retornou erro:', authError.message);
            // Se o erro for de credenciais ou rede, verifica se é modo fallback
            if (trimmedEmail === 'motorista@demo.local') {
              const mockClient = createMockSupabase();
              const mockRes = await mockClient.auth.signInWithPassword({ email: trimmedEmail, password });
              authUser = mockRes.data?.user;
            } else {
              throw new Error(authError.message || 'E-mail ou senha incorretos.');
            }
          } else {
            authUser = data?.user;
          }
        } catch (err: any) {
          if (trimmedEmail === 'motorista@demo.local') {
            const mockClient = createMockSupabase();
            const mockRes = await mockClient.auth.signInWithPassword({ email: trimmedEmail, password });
            authUser = mockRes.data?.user;
          } else {
            throw err;
          }
        }
      } else {
        // Ambiente sem Supabase (Preview Vercel / Modo Demo Local)
        const { data, error: mockError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (mockError || !data?.user) {
          throw new Error(mockError?.message || 'E-mail ou senha incorretos.');
        }

        authUser = data.user;
      }

      if (!authUser) {
        throw new Error('Não foi possível autenticar o usuário.');
      }

      // Garantir cookie de sessão
      if (typeof document !== 'undefined') {
        document.cookie = `sb-demo-token=${authUser.id}; path=/; max-age=86400; SameSite=Lax`;
      }

      // 2. Verificar ou criar cadastro de motorista
      try {
        const { data: motorista, error: dbError } = await supabase
          .from('motoristas')
          .select('status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (dbError) {
          console.warn('[Login] Tabela motoristas não acessível:', dbError);
        }

        if (!motorista && isSupabaseConfigured) {
          // Auto-criar registro se ainda não existir no Supabase
          await supabase.from('motoristas').insert([
            {
              id: authUser.id,
              email: trimmedEmail,
              nome: trimmedEmail.split('@')[0] || 'Motorista',
              status: 'Aprovado',
              work_status: 'OFFLINE',
            },
          ]);
        }
      } catch (dbEx) {
        console.warn('[Login] Erro ao sincronizar motorista:', dbEx);
      }

      // 3. Redirecionar com sucesso para o painel principal
      console.info('[Login] Login bem-sucedido. Redirecionando...');
      router.replace('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('[Login] Falha no login:', err);
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
          backgroundImage: `radial-gradient(circle at 10% 10%, rgba(224,184,0,0.06), transparent 10%), linear-gradient(180deg, rgba(224,184,0,0.06) 0%, rgba(11,18,36,var(--login-gradient-opacity)) 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B141A]/75 via-[#0B141A]/88 to-[#0B141A] pointer-events-none" />

      {/* Topo: Logo e Ajuda */}
      <header className="relative z-10 flex justify-between items-center p-6 pt-10">
        <Link href="/welcome" className="flex items-center gap-2 text-brand hover:opacity-80 transition">
          <ArrowLeft size={22} className="text-white" />
          <CarTaxiFront size={28} strokeWidth={1.5} />
          <span className="font-extrabold text-white text-lg tracking-wide">
            SR <span className="text-brand">Logística</span>
          </span>
        </Link>

        <button
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-1.5 text-white font-medium text-sm hover:text-brand transition-colors"
        >
          Ajuda <HelpCircle size={18} className="text-slate-300" />
        </button>
      </header>

      {/* Formulário Central Translúcido */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 my-auto max-w-md w-full mx-auto">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
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
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <Link href="/recuperar-senha" className="text-xs text-brand hover:underline transition">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-slate-950 mt-2 py-4 rounded-2xl font-black text-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-brand/20"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-5">
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-[11px] text-slate-300">
              Modo local / teste: <span className="font-semibold text-brand">motorista@demo.local</span> / <span className="font-semibold text-brand">demo123</span>
            </div>

            <p className="text-slate-400 text-xs">
              Ainda não tem conta?{' '}
              <Link href="/cadastro" className="text-brand font-bold hover:underline transition">
                Criar uma conta
              </Link>
            </p>

            {/* BOTÃO DE DOWNLOAD DO APK */}
            <div className="pt-5 border-t border-white/10 flex justify-center">
              <a
                href="/sr-logistica.apk"
                download
                className="flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-full transition-all border border-white/10 active:scale-95"
              >
                <Download size={18} className="text-emerald-400" />
                Baixar App para Android
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé: Versão e Faixa de Atualização */}
      <footer className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center text-slate-400 text-xs mb-3">Versão 3.42.00</div>

        <div className="w-full bg-[#A832A8] p-4 flex items-center gap-3 cursor-pointer hover:bg-[#962896] active:bg-[#852385] transition-colors shadow-inner">
          <div className="bg-white rounded-full p-0.5 shrink-0">
            <Info size={14} className="text-[#A832A8]" strokeWidth={3} />
          </div>
          <p className="text-white text-xs font-medium leading-tight">
            Há uma nova atualização disponível para instalar. Clique aqui para atualizar.
          </p>
        </div>
      </footer>
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
