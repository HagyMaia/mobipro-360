"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Download,
  KeyRound,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { Logo } from '@/components/Brand/Logo';
import { BiometricAuthService, BiometricCredentialData } from '@/services/auth/BiometricAuthService';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);

  // Estados de Biometria / Impressão Digital
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [enrolledData, setEnrolledData] = useState<BiometricCredentialData | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<{ id: string; email: string; rawPass: string } | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // 1. Modal para SOLICITAR link de redefinição de senha
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  // 2. Modal para DEFINIR NOVA SENHA (acionado automaticamente ao abrir o link do e-mail)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrMsg, setResetErrMsg] = useState('');

  // Inicializa verificação de biometria no celular
  useEffect(() => {
    BiometricAuthService.isBiometricAvailable().then((avail) => {
      setBiometricAvailable(avail);
      if (avail) {
        const enrolled = BiometricAuthService.isBiometricEnrolled();
        setBiometricEnrolled(enrolled);
        if (enrolled) {
          const data = BiometricAuthService.getEnrolledData();
          setEnrolledData(data);
          if (data?.email && !email) {
            setEmail(data.email);
          }
        }
      }
    });
  }, [email]);

  // Detecta quando o motorista abre o app vindo do link de recuperação
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setForgotModalOpen(false);
        setResetModalOpen(true);
      }
    });

    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        search.includes('type=recovery') ||
        search.includes('mode=reset')
      ) {
        setForgotModalOpen(false);
        setResetModalOpen(true);
      }
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login?mode=reset` : undefined;
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

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrMsg('');
    setResetSuccessMsg('');

    if (newPassword.length < 6) {
      setResetErrMsg('A nova senha deve ter no mínimo 6 caracteres.');
      setResetLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetErrMsg('As senhas digitadas não coincidem.');
      setResetLoading(false);
      return;
    }

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        throw new Error(updateErr.message || 'O link de recuperação expirou. Solicite um novo link.');
      }

      setResetSuccessMsg('Senha redefinida com sucesso! Você já pode entrar com sua nova senha no aplicativo.');
      setPassword(newPassword);
    } catch (err: any) {
      console.error('[ResetPassword] Erro ao redefinir senha:', err);
      setResetErrMsg(err.message || 'Erro ao atualizar senha.');
    } finally {
      setResetLoading(false);
    }
  };

  const doAuthenticateUser = useCallback(async (targetEmail: string, targetPass: string, isBioFlow: boolean = false) => {
    const trimmedEmail = targetEmail.trim().toLowerCase();
    let authUser: any = null;

    // 1. Autenticação via Supabase Auth
    if (isSupabaseConfigured) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: targetPass,
      });

      if (authError) {
        throw new Error(authError.message || 'E-mail ou senha incorretos.');
      }
      authUser = data?.user;
    } else {
      const { data, error: mockError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: targetPass,
      });

      if (mockError || !data?.user) {
        throw new Error(mockError?.message || 'E-mail ou senha incorretos.');
      }
      authUser = data.user;
    }

    if (!authUser) {
      throw new Error('Não foi possível autenticar o usuário. Verifique seus dados.');
    }

    // 2. Verificar cadastro ativo na tabela de motoristas
    if (isSupabaseConfigured) {
      let { data: motorista } = await supabase
        .from('motoristas')
        .select('id, status, nome, nome_social, email')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!motorista && authUser.email) {
        const { data: motoristaByEmail } = await supabase
          .from('motoristas')
          .select('id, status, nome, nome_social, email')
          .eq('email', authUser.email)
          .maybeSingle();

        if (motoristaByEmail) {
          motorista = motoristaByEmail;
          try {
            await supabase.from('motoristas').update({ id: authUser.id }).eq('id', motoristaByEmail.id);
          } catch (_) {}
        }
      }

      let activeMotorista = motorista;

      if (!activeMotorista) {
        const displayName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Motorista';
        const userShortId = authUser.id.replace(/\D/g, '').slice(0, 8) || authUser.id.slice(0, 8) || String(Date.now()).slice(-8);

        let autoPayload: Record<string, any> = {
          id: authUser.id,
          nome: displayName,
          nome_social: displayName,
          nome_completo: authUser.user_metadata?.full_name || displayName,
          email: authUser.email,
          cpf: authUser.user_metadata?.cpf || `000.${userShortId}-00`,
          cnh: `CNH${userShortId}`,
          telefone: authUser.user_metadata?.phone || `(92) 9${userShortId}`,
          phone: authUser.user_metadata?.phone || `(92) 9${userShortId}`,
          marca_veiculo: 'Chevrolet',
          modelo_veiculo: 'Onix Plus',
          ano_veiculo: '2024',
          placa_veiculo: 'ABC1D23',
          cor_veiculo: 'Prata',
          categoria: 'POPULAR',
          status: 'Pendente',
          vehicle_status: 'Pendente',
          work_status: 'OFFLINE',
          created_at: new Date().toISOString(),
        };

        let { data: newMotorista, error: createErr } = await supabase
          .from('motoristas')
          .upsert(autoPayload, { onConflict: 'id' })
          .select('id, status, nome')
          .maybeSingle();

        let attempts = 0;
        while (createErr && attempts < 8) {
          attempts++;
          const msg = createErr.message || '';
          const match =
            msg.match(/Could not find the '([^']+)' column/i) ||
            msg.match(/column "([^"]+)" of relation/i) ||
            msg.match(/column "([^"]+)" does not exist/i);

          if (match && match[1] && autoPayload[match[1]] !== undefined) {
            delete autoPayload[match[1]];
            const retry = await supabase
              .from('motoristas')
              .upsert(autoPayload, { onConflict: 'id' })
              .select('id, status, nome')
              .maybeSingle();
            newMotorista = retry.data;
            createErr = retry.error;
          } else if (msg.toLowerCase().includes('null value in column')) {
            const nullMatch = msg.match(/null value in column "([^"]+)"/i);
            if (nullMatch && nullMatch[1]) {
              const col = nullMatch[1];
              autoPayload[col] = autoPayload[col] || 'PENDENTE';
              const retry = await supabase
                .from('motoristas')
                .upsert(autoPayload, { onConflict: 'id' })
                .select('id, status, nome')
                .maybeSingle();
              newMotorista = retry.data;
              createErr = retry.error;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (newMotorista) {
          activeMotorista = newMotorista;
        } else {
          activeMotorista = { id: authUser.id, status: 'Pendente', nome: displayName };
        }
      }

      const normalizedStatus = String(activeMotorista?.status || '').trim().toLowerCase();
      if (normalizedStatus === 'bloqueado' || normalizedStatus === 'blocked') {
        await supabase.auth.signOut();
        if (typeof document !== 'undefined') {
          document.cookie = 'sb-demo-token=; path=/; max-age=0';
        }
        throw new Error('Sua conta de motorista está temporariamente bloqueada pela central de atendimento.');
      }

      if (normalizedStatus === 'reprovado' || normalizedStatus === 'rejected') {
        await supabase.auth.signOut();
        if (typeof document !== 'undefined') {
          document.cookie = 'sb-demo-token=; path=/; max-age=0';
        }
        throw new Error('Seu cadastro de motorista foi recusado na análise documental. Entre em contato com o suporte.');
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

    // 3. Garantir cookie de sessão
    if (typeof document !== 'undefined') {
      document.cookie = `sb-demo-token=${authUser.id}; path=/; max-age=86400; SameSite=Lax`;
    }

    // 4. Se o aparelho suporta biometria e ainda não está cadastrada, oferece ativação rápida
    if (!isBioFlow && biometricAvailable && !biometricEnrolled) {
      setPendingAuthUser({ id: authUser.id, email: trimmedEmail, rawPass: targetPass });
      setEnrollModalOpen(true);
      return;
    }

    router.replace('/');
    router.refresh();
  }, [biometricAvailable, biometricEnrolled, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await doAuthenticateUser(email, password, false);
    } catch (err: unknown) {
      console.error('[Login] Falha no login:', err);
      const msg = err instanceof Error ? err.message : 'Não foi possível entrar. Verifique seu e-mail e senha.';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Entrada com a Digital / Biometria do Celular
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');

    try {
      const res = await BiometricAuthService.authenticate();
      if (!res.success || !res.credentials) {
        if (res.error && !res.error.toLowerCase().includes('cancelada')) {
          setError(res.error || 'Falha na autenticação biométrica.');
        }
        setBiometricLoading(false);
        return;
      }

      if (res.credentials.password) {
        setEmail(res.credentials.email);
        setPassword(res.credentials.password);
        await doAuthenticateUser(res.credentials.email, res.credentials.password, true);
      } else {
        if (typeof document !== 'undefined' && res.credentials.userId) {
          document.cookie = `sb-demo-token=${res.credentials.userId}; path=/; max-age=86400; SameSite=Lax`;
        }
        router.replace('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error('[BiometricLogin] Erro:', err);
      setError('Falha ao validar a digital no celular.');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Cadastrar a Digital após login com senha
  const handleConfirmEnrollBiometrics = async () => {
    if (!pendingAuthUser) return;
    setEnrollLoading(true);

    try {
      const reg = await BiometricAuthService.registerBiometrics({
        email: pendingAuthUser.email,
        userId: pendingAuthUser.id,
        passwordOrSecret: pendingAuthUser.rawPass,
      });

      if (reg.success) {
        setBiometricEnrolled(true);
        setEnrollModalOpen(false);
        router.replace('/');
        router.refresh();
      } else {
        setError(reg.error || 'Não foi possível registrar a digital.');
        setEnrollModalOpen(false);
        router.replace('/');
        router.refresh();
      }
    } catch (err) {
      console.error('[BiometricEnroll] Erro:', err);
      setEnrollModalOpen(false);
      router.replace('/');
      router.refresh();
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSkipEnrollBiometrics = () => {
    setEnrollModalOpen(false);
    router.replace('/');
    router.refresh();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#070D18] text-white font-sans overflow-x-hidden select-none">
      {/* Background sofisticado com imagem sutil e gradientes */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('/images/white-taxi.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/95 via-[#070D18]/90 to-[#070D18] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

      {/* Header com Navegação e Suporte */}
      <header className="relative z-10 flex justify-between items-center px-5 pt-8 pb-4">
        <Link
          href="/welcome"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupportOpen(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-md"
          >
            <HelpCircle size={15} className="text-brand" />
            <span>Ajuda</span>
          </button>
        </div>
      </header>

      {/* Cartão Central de Login */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-5 my-auto max-w-md w-full mx-auto">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-7 sm:p-8 rounded-3xl shadow-2xl">
          {/* Cabeçalho do Cartão */}
          <div className="mb-6 text-center flex flex-col items-center">
            <div className="mb-4">
              <Logo size="lg" lightText subtitle="MOTORISTA" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Acesso ao Motorista</h1>
            <p className="text-slate-400 text-xs mt-1">
              Informe suas credenciais ou use a digital do seu aparelho.
            </p>
          </div>

          {/* BOTÃO DE LOGIN BIOMÉTRICO (DIGITAL / FACE) */}
          {biometricAvailable && biometricEnrolled && (
            <div className="mb-5 space-y-3">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-brand/25 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 border-2 border-brand text-white py-4 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand/15 active:scale-[0.98] group"
              >
                <div className="p-2 rounded-xl bg-brand text-slate-950 group-hover:scale-110 transition-transform">
                  <Fingerprint size={22} className={biometricLoading ? "animate-spin" : "animate-pulse"} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-brand tracking-wider">Acesso Rápido com 1 Toque</div>
                  <div className="text-sm font-black text-white">
                    {biometricLoading ? "Lendo Digital no Aparelho..." : "Entrar com a Digital do Celular"}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ou use e-mail e senha</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs text-center font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mail cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
                autoComplete="email"
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
                  className="text-xs text-brand hover:underline transition font-semibold"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || biometricLoading}
              className="w-full bg-brand text-slate-950 mt-2 py-4 rounded-2xl font-black text-base hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-brand/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar na Minha Conta</span>
              )}
            </button>
          </form>

          {/* Dica de Biometria para Celular sem cadastro ainda */}
          {biometricAvailable && !biometricEnrolled && (
            <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-slate-300">
              <Fingerprint size={20} className="text-brand shrink-0" />
              <span>Seu celular suporta <strong>Entrada com Digital</strong>. Ao fazer login você poderá ativá-la!</span>
            </div>
          )}

          {/* Links Auxiliares */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-slate-400 text-xs">
              Ainda não tem conta de motorista?{' '}
              <Link href="/cadastro" className="text-brand font-bold hover:underline transition">
                Cadastre-se aqui
              </Link>
            </p>

            <div className="pt-4 border-t border-white/10 flex justify-center">
              <a
                href="/sr-logistica.apk"
                download="sr-logistica.apk"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-2.5 px-4 rounded-full transition-all border border-white/10 active:scale-95"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Baixar App Android (APK)</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer com Selo de Segurança */}
      <footer className="relative z-10 w-full p-4 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>SR Logística • Conexão Criptografada SSL</span>
        </div>
      </footer>

      {/* MODAL 0: Ativação de Biometria / Impressão Digital */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0D1624] border-2 border-brand/50 p-6 rounded-3xl shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand border border-brand/30 shadow-lg shadow-brand/10">
              <Fingerprint size={36} className="animate-pulse" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-brand mb-2">
                Mais Praticidade
              </span>
              <h3 className="text-xl font-black text-white">
                Ativar Entrada com Digital?
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Seu aparelho é compatível com biometria. Deseja cadastrar sua impressão digital para entrar com 1 toque nas próximas vezes sem precisar digitar a senha?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmEnrollBiometrics}
                disabled={enrollLoading}
                className="w-full bg-brand text-slate-950 font-black py-3.5 rounded-2xl hover:brightness-105 active:scale-95 transition shadow-lg shadow-brand/20 text-sm flex items-center justify-center gap-2"
              >
                {enrollLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Lendo Sensor...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    <span>Sim, Ativar Minha Digital</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipEnrollBiometrics}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-400 font-semibold py-3 rounded-xl transition text-xs"
              >
                Agora Não, Entrar Direto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Recuperação de Senha */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D1624] border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4">
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

      {/* MODAL 2: Definir Nova Senha */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D1624] border border-brand/30 p-6 rounded-3xl shadow-2xl space-y-4">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/15 border border-brand/30 rounded-2xl text-brand shadow-lg shadow-brand/10">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Criar Nova Senha</h3>
                <p className="text-xs text-slate-400">Defina sua nova credencial de acesso</p>
              </div>
            </div>

            {resetSuccessMsg ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                    {resetSuccessMsg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetSuccessMsg('');
                  }}
                  className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 text-sm"
                >
                  Entrar com a Nova Senha
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Digite e confirme sua nova senha de acesso abaixo.
                </p>

                {resetErrMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium">
                    {resetErrMsg}
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
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Digite novamente a nova senha"
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3 rounded-xl transition text-sm border border-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-brand text-slate-950 font-bold py-3 rounded-xl hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-brand/20"
                  >
                    {resetLoading ? 'Salvando...' : 'Salvar Senha'}
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
