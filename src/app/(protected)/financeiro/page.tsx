'use client';

import { useEffect, useState } from 'react';
import { FinanceService } from '@/services/finance/FinanceService';
import { createClient } from '@/lib/supabase';
import { Wallet, History, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Card, SectionTitle } from '@/components/ui';

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
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-dark flex items-center justify-center text-slate-900 dark:text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                    <p className="text-sm font-medium">Sincronizando carteira...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark p-4 pb-24 transition-colors">
            <header className="mb-6 pt-4">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Financeiro</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhe seus ganhos e rentabilidade</p>
            </header>

            {/* Card de Saldo Principal */}
            <div className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-xl shadow-brand/30 transition-all active:scale-[0.98]">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white/80">
                        <Wallet size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Saldo Disponível</span>
                    </div>
                    <h2 className="mt-1 text-4xl font-black tracking-tight">
                        R$ {earnings.totalEarned.toFixed(2).replace('.', ',')}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-2 py-1 rounded-lg">
                        <TrendingUp size={14} />
                        <span>Ganhos acumulados</span>
                    </div>
                </div>
            </div>

            <section className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <SectionTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-brand" /> Histórico de Corridas
                    </SectionTitle>
                </div>

                {earnings.rides.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                            <History size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma corrida registrada</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Suas corridas aparecerão aqui após a conclusão.</p>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {earnings.rides.map((ride: any) => (
                            <Card key={ride.id} className="p-4 flex justify-between items-center hover:border-brand/30 transition-all active:scale-[0.98] border">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand">
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {new Date(ride.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {ride.distance_km} km percorrido
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-500 dark:text-emerald-400">
                                        R$ {Number(ride.fare_amount).toFixed(2).replace('.', ',')}
                                    </p>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Recebido</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <BottomNav />
        </div>
    );
}