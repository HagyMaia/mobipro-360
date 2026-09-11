'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileService } from '@/services/driver/ProfileService';
import { DriverProfile } from '@/types';
import { createClient } from '@/lib/supabase';
import { HelpCircle, RefreshCw, LogOut, Clock, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SupportModal } from '@/components/Support/SupportModal';
import { Logo } from '@/components/Brand/Logo';

export default function StatusPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await ProfileService.getCurrentProfile();
      const normalizedProfile = data ? { ...data, status: ProfileService.normalizeDriverStatus(data.status) } : data;
      setProfile(normalizedProfile);

      if (normalizedProfile?.status === 'Aprovado') {
        router.replace('/');
      }
    } catch (e) {
      console.error('Erro ao buscar status:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-demo-token=; path=/; max-age=0';
    }
    router.replace('/welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Verificando status do cadastro...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (profile?.status) {
      case 'Reprovado':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/15 border border-red-500/30 rounded-3xl flex items-center justify-center mb-6 text-red-400 shadow-xl shadow-red-500/10 mx-auto">
              <AlertTriangle size={38} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Documentação Recusada</h1>
            <p className="text-slate-300 text-xs mb-6 px-4 leading-relaxed">
              Infelizmente, um ou mais documentos ou dados informados não atenderam aos requisitos de segurança da frota.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 text-left text-xs text-red-300 leading-relaxed">
              Entre em contato com a Central de Suporte para esclarecer os detalhes e regularizar seus documentos.
            </div>
            <button
              onClick={() => setSupportOpen(true)}
              className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-2xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 text-sm mb-3"
            >
              Falar com o Suporte da Central
            </button>
          </div>
        );

      case 'Bloqueado':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/30 rounded-3xl flex items-center justify-center mb-6 text-amber-400 shadow-xl shadow-amber-500/10 mx-auto">
              <ShieldAlert size={38} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Conta Temporariamente Suspensa</h1>
            <p className="text-slate-300 text-xs mb-6 px-4 leading-relaxed">
              O acesso às corridas foi pausado preventivamente pela nossa central de segurança.
            </p>
            <button
              onClick={() => setSupportOpen(true)}
              className="w-full bg-brand text-slate-950 font-bold py-3.5 rounded-2xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 text-sm mb-3"
            >
              Contatar Suporte Imediato
            </button>
          </div>
        );

      case 'Pendente':
      default:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-brand/15 border border-brand/30 rounded-3xl flex items-center justify-center mb-6 text-brand shadow-xl shadow-brand/10 mx-auto">
              <Clock size={38} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Cadastro em Análise</h1>
            <p className="text-slate-300 text-xs mb-6 px-4 leading-relaxed">
              Seus dados e documentos foram recebidos com sucesso. Nossa equipe operacional está validando seu perfil para liberação no sistema.
            </p>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 text-left text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 size={16} />
                <span>Documentos e Veículo Enviados</span>
              </div>
              <div className="flex items-center gap-2 text-brand font-semibold">
                <Clock size={16} />
                <span>Prazo estimado: até 24 a 48 horas úteis</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col justify-between p-6 text-white font-sans select-none">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-white/10">
        <Logo size="sm" lightText subtitle="MOTORISTA" />
        <button
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-slate-300 hover:text-white transition"
        >
          <HelpCircle size={15} className="text-brand" />
          <span>Suporte</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8">
        {renderContent()}
      </main>

      {/* Actions */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="w-full bg-brand text-slate-950 font-bold py-4 rounded-2xl hover:brightness-105 active:scale-[0.98] transition shadow-lg shadow-brand/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Verificando...' : 'Atualizar Status'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold py-3.5 rounded-xl transition text-xs border border-white/5"
        >
          <LogOut size={15} />
          <span>Sair da Conta</span>
        </button>
      </div>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}