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
        setProfile(data);

        if (data?.status === 'APPROVED') {
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
            case 'IN_ANALYSIS':
            case 'PENDING':
                return (
                    <>
                        <div className="w-20 h-20 bg-status-warning/20 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 text-center">Cadastro em Análise</h1>
                        <p className="text-zinc-400 text-center text-sm mb-8 px-4">
                            Recebemos seus documentos! Nossa equipe está analisando seus dados. Esse processo pode levar até 48 horas úteis.
                        </p>
                    </>
                );

            case 'REJECTED':
                return (
                    <>
                        <div className="w-20 h-20 bg-status-busy/20 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-status-busy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 text-center">Documentos Recusados</h1>
                        <p className="text-zinc-400 text-center text-sm mb-6 px-4">
                            Infelizmente, um ou mais documentos não foram aprovados. Por favor, acesse seu perfil e reenvie os documentos pendentes.
                        </p>
                        <button
                            onClick={() => router.push('/perfil/documentos')}
                            className="w-full bg-brand-surface border border-brand-border text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition mb-4"
                        >
                            Revisar Documentos
                        </button>
                    </>
                );

            case 'BLOCKED':
                return (
                    <>
                        <div className="w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 text-center">Conta Suspensa</h1>
                        <p className="text-zinc-400 text-center text-sm mb-8 px-4">
                            Sua conta foi suspensa temporariamente por descumprimento dos Termos de Uso. Entre em contato com o suporte.
                        </p>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {renderContent()}
            </div>

            <div className="w-full max-w-sm flex flex-col gap-3">
                <button
                    onClick={fetchStatus}
                    className="w-full bg-brand-primary text-black font-bold py-3 rounded-lg hover:bg-brand-hover transition"
                >
                    Atualizar Status
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full bg-transparent text-zinc-500 font-semibold py-3 rounded-lg hover:text-zinc-300 transition"
                >
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}