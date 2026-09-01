// src/app/status/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileService } from '@/services/driver/ProfileService';
import { DriverProfile } from '@/types';
import { createClient } from '@/lib/supabase';

export default function StatusPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        const data = await ProfileService.getCurrentProfile();
        const normalizedProfile = data ? { ...data, status: ProfileService.normalizeDriverStatus(data.status) } : data;
        setProfile(normalizedProfile);

        if (normalizedProfile?.status === 'Aprovado') {
            router.replace('/mapa');
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/login');
    };

    if (loading) return null; // O layout já mostra o spinner

    const renderContent = () => {
        switch (profile?.status) {
            case 'Pendente':
                return (
                    <>
                        <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mb-6 text-brand shadow-lg shadow-brand/20">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[color:var(--text)] dark:text-white mb-2 text-center">Cadastro em Análise</h1>
                        <p className="text-slate-400 text-center text-sm mb-8 px-4 leading-relaxed">
                            Recebemos seus documentos! Nossa equipe está analisando seus dados. Esse processo pode levar até 48 horas úteis.
                        </p>
                    </>
                );

            case 'Reprovado':
                return (
                    <>
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500 shadow-lg shadow-red-500/20">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[color:var(--text)] dark:text-white mb-2 text-center">Documentos Recusados</h1>
                        <p className="text-slate-400 text-center text-sm mb-6 px-4 leading-relaxed">
                            Infelizmente, um ou mais documentos não foram aprovados. Por favor, acesse seu perfil e reenvie os documentos pendentes.
                        </p>
                        <button
                            onClick={() => router.push('/perfil/documentos')}
                            className="w-full bg-white/10 border border-white/10 text-[color:var(--text)] dark:text-white font-bold py-3 rounded-xl hover:bg-white/20 transition mb-4 backdrop-blur-sm"
                        >
                            Revisar Documentos
                        </button>
                    </>
                );

            case 'Bloqueado':
                return (
                    <>
                        <div className="w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center mb-6 text-red-500">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[color:var(--text)] dark:text-white mb-2 text-center">Conta Suspensa</h1>
                        <p className="text-slate-400 text-center text-sm mb-8 px-4 leading-relaxed">
                            Sua conta foi suspensa temporariamente por descumprimento dos Termos de Uso. Entre em contato com o suporte.
                        </p>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center p-6">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {renderContent()}
            </div>

            <div className="w-full max-w-sm flex flex-col gap-3">
                <button
                    onClick={fetchStatus}
                    className="w-full bg-brand text-[color:var(--text)] dark:text-white font-bold py-4 rounded-2xl hover:bg-brand-600 transition shadow-lg shadow-brand/20 active:scale-[0.98]"
                >
                    Atualizar Status
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full bg-transparent text-slate-500 font-semibold py-3 rounded-xl hover:text-slate-300 transition"
                >
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}