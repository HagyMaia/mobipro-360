"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { supabase, browserUrl, isSupabaseConfigured, createMockSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, CarTaxiFront, Info, Download, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { ProfileService } from '@/services/driver/ProfileService';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  // Modal de Recuperação de Senha (Pop-up no próprio App)
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErr('');
    setForgotMsg('');

    const targetEmail = (forgotEmail || email).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setForgotErr('Por favor, digite um e-mail válido.');
      setForgotLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/atualizar-senha` : undefined;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: redirectUrl,
        });

        if (resetError) {
          throw new Error(resetError.message || 'Falha ao enviar e-mail de recuperação.');
        }
      }

      setForgotMsg(`Pronto! Enviamos o link de recuperação para ${targetEmail}. Verifique sua caixa de entrada e a pasta de Spam.`);
    } catch (err: any) {
      console.error('[RecuperarSenha] Erro:', err);
      setForgotErr(err.message || 'Não foi possível solicitar a redefinição de senha.');
    } finally {
      setForgotLoading(false);
    }
  };

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

      // 2. Verificar cadastro ativo na tabela de motoristas
      if (isSupabaseConfigured && trimmedEmail !== 'motorista@demo.local') {
        const { data: motorista, error: dbError } = await supabase
          .from('motoristas')
          .select('id, status, nome')
          .eq('id', authUser.id)
          .maybeSingle();

        if (dbError) {
          console.warn('[Login] Erro ao consultar tabela motoristas:', dbError);
        }

        let activeMotorista = motorista;

        if (!activeMotorista) {
          console.warn('[Login] Usuário autenticado sem registro em motoristas. Auto-recuperando perfil...');
          const displayName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Motorista';
          const { data: newMotorista, error: createErr } = await supabase
            .from('motoristas')
            .upsert({
              id: authUser.id,
              nome: displayName,
              nome_social: displayName,
              nome_completo: authUser.user_metadata?.full_name || displayName,
              email: authUser.email,
              cpf: authUser.user_metadata?.cpf || '',
              telefone: authUser.user_metadata?.phone || '',
              marca_veiculo: 'Chevrolet',
              modelo_veiculo: 'Onix Plus',
              ano_veiculo: '2024',
              placa_veiculo: 'ABC1D23',
              cor_veiculo: 'Prata',
              categoria: 'POPULAR',
              status: 'Pendente',
              vehicle_status: 'Aprovado',
            }, { onConflict: 'id' })
            .select('id, status, nome')
            .maybeSingle();

          if (createErr) {
            console.error('[Login] Erro ao auto-criar perfil em motoristas:', createErr);
            throw new Error('Conta de motorista não encontrada. Contate o suporte da SR Logística.');
          } else {
            activeMotorista = newMotorista;
          }
        }

        const normalizedStatus = String(activeMotorista?.status || '').trim().toLowerCase();
        if (normalizedStatus === 'bloqueado' || normalizedStatus === 'blocked') {
          await supabase.auth.signOut();
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-demo-token=; path=/; max-age=0';
          }
          throw new Error('Sua conta de motorista está temporariamente bloqueada pela central.');
        }

        if (normalizedStatus === 'reprovado' || normalizedStatus === 'rejected') {
          await supabase.auth.signOut();
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-demo-token=; path=/; max-age=0';
          }
          throw new Error('Seu cadastro de motorista foi reprovado pela análise da SR Logística.');
        }

        if (normalizedStatus === 'pendente' || normalizedStatus === 'pending') {
          if (typeof document !== 'undefined') {
            document.cookie = `sb-demo-token=${authUser.id}; path=/; max-age=86400; SameSite=Lax`;
          }
          router.replace('/status');
          router.refresh();
          return;
        }
      }

      // Garantir cookie de sessão
      if (typeof document !== 'undefined') {
        document.cookie = `sb-demo-token=${authUser.id}; path=/; max-age=86400; SameSite=Lax`;
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMsg('');
                    setForgotErr('');
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-brand hover:underline transition"
                >
                  Esqueceu a senha?
                </button>
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
                download="sr-logistica.apk"
                className="flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-full transition-all border border-white/10 active:scale-95"
              >
                <Download size={18} className="text-emerald-400" />
                Baixar App para Android (APK)
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé: Versão e Faixa de Atualização */}
      <footer className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center text-slate-400 text-xs mb-3">Versão 3.42.00</div>

        <a
          href="/sr-logistica.apk"
          download="sr-logistica.apk"
          className="w-full bg-[#A832A8] p-4 flex items-center gap-3 cursor-pointer hover:bg-[#962896] active:bg-[#852385] transition-colors shadow-inner"
        >
          <div className="bg-white rounded-full p-0.5 shrink-0">
            <Info size={14} className="text-[#A832A8]" strokeWidth={3} />
          </div>
          <p className="text-white text-xs font-medium leading-tight">
            Há uma nova versão do aplicativo Android disponível. Toque aqui para baixar o APK.
          </p>
        </a>
      </footer>

      {/* POP-UP MODAL: Recuperação de Senha */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D1624] border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4">
            {/* Botão Fechar */}
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Recuperar Senha</h3>
                <p className="text-xs text-slate-400">Sem sair do aplicativo</p>
              </div>
            </div>

            {forgotMsg ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                    {forgotMsg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 text-sm"
                >
                  Entendido, Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Digite seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha diretamente.
                </p>

                {forgotErr && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium">
                    {forgotErr}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">E-mail do motorista</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3 rounded-xl transition text-sm border border-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-brand text-slate-950 font-bold py-3 rounded-xl hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-brand/20"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
