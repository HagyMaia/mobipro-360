"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Download,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  ShieldCheck,
  Fingerprint,
  Eye,
  EyeOff
} from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { Logo } from '@/components/Brand/Logo';
import { BiometricAuthService, BiometricCredentialData } from '@/services/auth/BiometricAuthService';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const [showNewPassword, setShowNewPassword] = useState(false);
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

  // Verifica se já existe uma sessão salva e válida do motorista
  useEffect(() => {
    let isMounted = true;
    const checkActiveSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const { data: motorista } = await supabase
            .from('motoristas')
            .select('id, status')
            .eq('id', user.id)
            .maybeSingle();

          const normalizedStatus = String(motorista?.status || '').trim().toLowerCase();
          if (normalizedStatus === 'bloqueado' || normalizedStatus === 'reprovado') {
            await supabase.auth.signOut();
            return;
          }

          if (normalizedStatus === 'pendente' || normalizedStatus === 'pending') {
            router.replace('/status');
          } else {
            router.replace('/');
          }
        }
      } catch (_) {
        // Se falhar ou não houver sessão salva, permanece na tela de login
      }
    };

    checkActiveSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

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
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Por favor, informe um e-mail válido.');
    }

    if (!targetPass) {
      throw new Error('Por favor, digite sua senha de acesso.');
    }

    let authUser: any = null;

    // 1. Autenticação via Supabase Auth
    if (isSupabaseConfigured) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: targetPass,
      });

      if (authError) {
        const rawMsg = authError.message || '';
        if (rawMsg.includes('Invalid login credentials') || rawMsg.includes('invalid_grant')) {
          throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (rawMsg.includes('Email not confirmed')) {
          throw new Error('Seu e-mail cadastrado ainda não foi confirmado. Verifique sua caixa de entrada.');
        } else if (rawMsg.includes('Too many requests') || rawMsg.includes('rate limit')) {
          throw new Error('Muitas tentativas sem sucesso. Por segurança, aguarde alguns instantes antes de tentar novamente.');
        } else if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
          throw new Error('Falha na conexão com o servidor. Verifique sua conexão com a internet.');
        } else {
          throw new Error(rawMsg || 'Não foi possível autenticar. Verifique seus dados.');
        }
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
          if (motoristaByEmail.id !== authUser.id) {
            try {
              await supabase.from('motoristas').update({ id: authUser.id }).eq('id', motoristaByEmail.id);
            } catch (_) {}
          }
        }
      }

      let activeMotorista = motorista;

      if (!activeMotorista) {
        // Usuário autenticado no Auth mas sem registro na tabela de motoristas.
        // Registra status pendente com os dados reais já fornecidos no cadastro.
        const displayName = authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Motorista';
        const autoPayload: Record<string, any> = {
          id: authUser.id,
          nome: displayName,
          nome_social: displayName,
          nome_completo: authUser.user_metadata?.full_name || displayName,
          email: authUser.email,
          cpf: authUser.user_metadata?.cpf || null,
          telefone: authUser.user_metadata?.phone || null,
          status: 'Pendente',
          work_status: 'OFFLINE',
          created_at: new Date().toISOString(),
        };

        const { data: newMotorista } = await supabase
          .from('motoristas')
          .upsert(autoPayload, { onConflict: 'id' })
          .select('id, status, nome')
          .maybeSingle();

        activeMotorista = newMotorista || { id: authUser.id, status: 'Pendente', nome: displayName };
      }

      const normalizedStatus = String(activeMotorista?.status || '').trim().toLowerCase();
      if (normalizedStatus === 'bloqueado' || normalizedStatus === 'blocked') {
        await supabase.auth.signOut();
        throw new Error('Sua conta de motorista está temporariamente bloqueada pela central de atendimento.');
      }

      if (normalizedStatus === 'reprovado' || normalizedStatus === 'rejected') {
        await supabase.auth.signOut();
        throw new Error('Seu cadastro de motorista foi recusado na análise documental. Entre em contato com o suporte.');
      }

      if (normalizedStatus === 'pendente' || normalizedStatus === 'pending') {
        router.replace('/status');
        router.refresh();
        return;
      }
    }

    // 3. Se o aparelho suporta biometria e ainda não está cadastrada, oferece ativação rápida
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
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!password) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await doAuthenticateUser(cleanEmail, password, false);
    } catch (err: unknown) {
      console.error('[Login] Falha no login:', err);
      const msg = err instanceof Error ? err.message : 'Não foi possível entrar. Verifique seu e-mail e senha.';
      setError(msg);
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
        setEmail(res.credentials.email);
        setError('Por segurança, digite sua senha para revalidar a biometria neste aparelho.');
      }
    } catch (err: any) {
      console.error('[BiometricLogin] Erro:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao validar a digital no celular.';
      setError(msg);
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
      {/* Background Executivo com Imagem de Luxo Noturna e Gradientes Refinados */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105 opacity-35 pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80'), url('/images/taxi-bg.jpg')",
        }}
      />
      {/* Multi-camadas de sombreamento dark para contraste ideal */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-[#070D18]/85 to-[#070D18]/90 pointer-events-none" />
      <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-[#F59E0B]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 rounded-full bg-[#F59E0B]/5 blur-[120px] pointer-events-none" />

      {/* HEADER: Voltar ao Início + Suporte / Ajuda */}
      <header className="relative z-10 flex justify-between items-center px-5 sm:px-8 pt-8 pb-3 max-w-5xl w-full mx-auto">
        <Link
          href="/welcome"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-md active:scale-95 shadow-sm"
        >
          <ArrowLeft size={15} />
          <span>Voltar ao Início</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-md active:scale-95 shadow-sm"
          >
            <HelpCircle size={15} className="text-[#F59E0B]" />
            <span>Ajuda</span>
          </button>
        </div>
      </header>

      {/* CARTÃO PRINCIPAL DE LOGIN */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 my-auto max-w-md w-full mx-auto">
        <div className="relative bg-[#0B1324]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Linha sutil de brilho dourado no topo do card */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B]/80 to-transparent pointer-events-none" />

          {/* Cabeçalho do Cartão com Logo e Badge Executivo */}
          <div className="mb-6 text-center flex flex-col items-center">
            <div className="mb-3">
              <Logo size="lg" lightText subtitle="MOTORISTA" />
            </div>

            {/* Badge de Mobilidade Executiva & Corporativa (Referência da Tela Splash) */}
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/15 border border-[#F59E0B]/40 px-3 py-1 rounded-full mb-3 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[11px] font-bold text-[#F59E0B] tracking-wide">
                Mobilidade Executiva & Corporativa
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Acesso do Motorista
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
              Entre com suas credenciais ou use o leitor de digital cadastrado no aparelho.
            </p>
          </div>

          {/* BOTÃO DE LOGIN BIOMÉTRICO (DIGITAL / FACE) */}
          {biometricAvailable && biometricEnrolled && (
            <div className="mb-5 space-y-3">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-[#F59E0B]/20 via-[#F59E0B]/30 to-[#F59E0B]/20 hover:from-[#F59E0B]/35 hover:to-[#F59E0B]/35 border-2 border-[#F59E0B] text-white py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3.5 transition-all shadow-xl shadow-[#F59E0B]/15 active:scale-[0.98] group"
              >
                <div className="p-2 rounded-xl bg-[#F59E0B] text-slate-950 group-hover:scale-105 transition-transform shadow-md">
                  <Fingerprint size={22} className={biometricLoading ? "animate-spin" : "animate-pulse"} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-[10px] uppercase font-black text-[#F59E0B] tracking-wider">
                    Acesso Rápido com 1 Toque
                  </div>
                  <div className="text-sm font-black text-white leading-tight">
                    {biometricLoading ? "Validando Biometria no Aparelho..." : "Entrar com a Digital do Celular"}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ou entre com e-mail e senha</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN POR E-MAIL E SENHA */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={17} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Campo de E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Mail size={13} className="text-[#F59E0B]" />
                <span>E-mail cadastrado</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-[#070D18]/80 border border-slate-700/60 hover:border-slate-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none text-sm transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo de Senha com Visibilidade e Link de Recuperação */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-[#F59E0B]" />
                  <span>Senha de acesso</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMsg('');
                    setForgotErr('');
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-[#F59E0B] hover:text-[#fbbf24] hover:underline transition font-bold"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#070D18]/80 border border-slate-700/60 hover:border-slate-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 p-3.5 pr-11 rounded-xl text-white placeholder-slate-500 outline-none text-sm transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-white transition rounded-lg"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL DE ACESSO (Estilo Começar Agora do Screenshot) */}
            <button
              type="submit"
              disabled={loading || biometricLoading}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Minha Conta</span>
                  <ArrowRight size={18} strokeWidth={2.8} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Biometria para Celular sem cadastro ainda */}
          {biometricAvailable && !biometricEnrolled && (
            <div className="mt-4 p-3 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center gap-3 text-xs text-amber-200/90 leading-relaxed">
              <Fingerprint size={22} className="text-[#F59E0B] shrink-0" />
              <span>
                Seu aparelho é compatível com <strong>Biometria</strong>. Após entrar com sua senha você poderá ativá-la com 1 toque!
              </span>
            </div>
          )}

          {/* Links e Botão Auxiliar de Download */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-4">
            <p className="text-slate-400 text-xs">
              Ainda não tem conta de motorista?{' '}
              <Link href="/cadastro" className="text-[#F59E0B] font-bold hover:underline transition">
                Cadastre-se aqui
              </Link>
            </p>

            {/* Botão de Download do APK Android (Inspirado no visual executivo do banner) */}
            <a
              href="/sr-logistica.apk"
              download="sr-logistica.apk"
              className="w-full bg-[#0d2a1d]/80 hover:bg-[#123827] border border-emerald-500/40 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-between text-xs transition duration-200 shadow-md active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B] text-slate-950 flex items-center justify-center font-bold shadow">
                  <Download size={14} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">Instalar Aplicativo no Celular</span>
              </div>
              <span className="bg-[#785918]/80 text-[#F59E0B] border border-[#F59E0B]/40 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Grátis
              </span>
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER: Selo de Criptografia SSL + Cidade Manaus - AM */}
      <footer className="relative z-10 w-full p-4 flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Conexão Segura & Criptografada SSL • 256-bit</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          SR Logística & Transporte • Manaus - AM
        </p>
      </footer>

      {/* MODAL 0: Ativação de Biometria / Impressão Digital */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#0B1324] border-2 border-[#F59E0B]/50 p-6 sm:p-7 rounded-3xl shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-lg shadow-[#F59E0B]/10">
              <Fingerprint size={36} className="animate-pulse" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#F59E0B] mb-2">
                Mais Praticidade
              </span>
              <h3 className="text-xl font-black text-white">
                Ativar Entrada com Digital?
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Seu aparelho é compatível com biometria. Deseja cadastrar sua impressão digital para entrar com 1 toque nas próximas vezes sem precisar digitar sua senha?
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleConfirmEnrollBiometrics}
                disabled={enrollLoading}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black py-3.5 rounded-2xl active:scale-95 transition shadow-lg shadow-amber-500/25 text-sm flex items-center justify-center gap-2"
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
                className="w-full bg-white/5 hover:bg-white/10 text-slate-400 font-semibold py-3 rounded-xl transition text-xs border border-white/5"
              >
                Agora Não, Entrar Direto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Solicitação de Recuperação de Senha */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0B1324] border border-white/15 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-2xl text-[#F59E0B]">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Recuperar Senha</h3>
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
                  className="w-full bg-[#F59E0B] text-slate-950 font-bold py-3.5 rounded-xl hover:bg-[#D97706] active:scale-[0.98] transition shadow-lg shadow-amber-500/25 text-sm"
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
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium">
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
                    className="w-full bg-[#070D18]/80 border border-slate-700/60 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none text-sm transition"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
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
                    className="flex-1 bg-[#F59E0B] text-slate-950 font-bold py-3 rounded-xl hover:bg-[#D97706] active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-amber-500/25"
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
          <div className="relative w-full max-w-md bg-[#0B1324] border border-[#F59E0B]/40 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-2xl text-[#F59E0B] shadow-lg shadow-amber-500/10">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Criar Nova Senha</h3>
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
                  className="w-full bg-[#F59E0B] text-slate-950 font-bold py-3.5 rounded-xl hover:bg-[#D97706] active:scale-[0.98] transition shadow-lg shadow-amber-500/25 text-sm"
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
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium">
                    {resetErrMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nova Senha</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#070D18]/80 border border-slate-700/60 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 p-3.5 pr-11 rounded-xl text-white placeholder-slate-500 outline-none text-sm transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 p-1.5 text-slate-400 hover:text-white transition rounded-lg"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirme a Nova Senha</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Digite novamente a nova senha"
                    className="w-full bg-[#070D18]/80 border border-slate-700/60 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 p-3.5 rounded-xl text-white placeholder-slate-500 outline-none text-sm transition"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
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
                    className="flex-1 bg-[#F59E0B] text-slate-950 font-bold py-3 rounded-xl hover:bg-[#D97706] active:scale-[0.98] transition disabled:opacity-50 text-sm shadow-lg shadow-amber-500/25"
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
