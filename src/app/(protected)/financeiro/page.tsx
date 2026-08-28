// src/app/(protected)/financeiro/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { FinanceService } from '@/services/finance/FinanceService';
import { createClient } from '@/lib/supabase';

export default function FinanceiroPage() {
    const [earnings, setEarnings] = useState({ rides: [], totalEarned: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinance = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();

            if (data?.user) {
                try {
                    const result = await FinanceService.getDriverEarnings(data.user.id);
                    setEarnings(result as any);
                } catch (error) {
                    console.error(error);
                }
            }
            setLoading(false);
        };

        fetchFinance();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">Carregando carteira...</div>;
    }

    return (
        <div className="min-h-screen bg-brand-dark p-6 pb-24">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Meus Ganhos</h1>
                <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border shadow-floating">
                    <p className="text-zinc-400 text-sm mb-1">Saldo Total</p>
                    <h2 className="text-4xl font-black text-brand-primary">
                        R$ {earnings.totalEarned.toFixed(2).replace('.', ',')}
                    </h2>
                </div>
            </header>

            <section>
                <h3 className="text-lg font-bold text-white mb-4">Histórico de Corridas</h3>
                {earnings.rides.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Você ainda não realizou nenhuma corrida.</p>
                ) : (
                    <div className="space-y-3">
                        {earnings.rides.map((ride: any) => (
                            <div key={ride.id} className="bg-zinc-800/50 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                                <div>
                                    <p className="text-white text-sm font-semibold">{new Date(ride.created_at).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{ride.distance_km} km percorrido</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-status-online font-bold text-lg">R$ {Number(ride.fare_amount).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}