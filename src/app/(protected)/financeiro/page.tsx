'use client';

import { useEffect, useState } from 'react';
import { FinanceService, DriverEarningsSummary } from '@/services/finance/FinanceService';
import { createClient } from '@/lib/supabase';
import {
    Wallet,
    History,
    TrendingUp,
    ArrowUpRight,
    AlertCircle,
    FileText,
    QrCode,
    Percent,
    ShieldCheck,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Card, SectionTitle } from '@/components/ui';

export default function FinanceiroPage() {
    const [earnings, setEarnings] = useState<DriverEarningsSummary>({
        rides: [],
        totalEarned: 0,
        grossTotal: 0,
        totalDiscount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFinance = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();

            if (data?.user) {
                try {
                    const result = await FinanceService.getDriverEarnings(data.user.id);
                    setEarnings(result);
                } catch (err: any) {
                    console.error('[Financeiro] Erro ao carregar carteira:', err);
                    setError('Não foi possível carregar as informações financeiras. Tente novamente mais tarde.');
                }
            }
            setLoading(false);
        };

        fetchFinance();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

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
        <div className="min-h-screen bg-[color:var(--bg)] text-slate-900 dark:text-slate-100 p-4 pb-24 transition-colors">
            <header className="mb-6 pt-4">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Carteira & Financeiro</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhe seu saldo líquido, extrato e rentabilidade por corrida
                </p>
            </header>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-red-600 dark:text-red-400 border border-red-500/20">
                    <AlertCircle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Card de Saldo Principal na Carteira */}
            <div className="relative overflow-hidden rounded-3xl bg-brand p-6 text-slate-950 shadow-xl shadow-brand/25 transition-all active:scale-[0.98]">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-950/80 font-bold">
                            <Wallet size={16} />
                            <span className="text-xs uppercase tracking-wider">Saldo Líquido na Carteira</span>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-black/15 text-slate-950 px-2 py-0.5 rounded-full">
                            Valor Disponível
                        </span>
                    </div>

                    <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                        {formatCurrency(earnings.totalEarned)}
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black bg-black/10 w-fit px-3 py-1 rounded-full text-slate-950">
                            <TrendingUp size={14} />
                            <span>Ganhos Líquidos Acumulados</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumo de Repasses & Regras de Desconto */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <Card className="p-3.5 border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        <Percent size={12} className="text-amber-500" /> Corridas Particulares
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                        20% taxa plataforma
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ex: R$ 100 → <strong className="text-emerald-600 dark:text-emerald-400">R$ 80 na carteira</strong>
                    </p>
                </Card>

                <Card className="p-3.5 border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        <ShieldCheck size={12} className="text-teal-500" /> Voucher Empresa
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                        100% Repasse
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Voucher corporativo sem desconto
                    </p>
                </Card>
            </div>

            {/* Extrato / Histórico */}
            <section className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <SectionTitle className="flex items-center gap-2 mb-0">
                        <History size={18} className="text-brand-600 dark:text-brand" /> Extrato Detalhado de Corridas
                    </SectionTitle>
                    <span className="text-xs font-bold text-slate-400">
                        {earnings.rides.length} {earnings.rides.length === 1 ? 'corrida' : 'corridas'}
                    </span>
                </div>

                {earnings.rides.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                            <History size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma corrida concluída</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Suas corridas concluídas aparecerão aqui com o crédito líquido discriminado.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {earnings.rides.map((ride) => (
                            <Card
                                key={ride.id}
                                className="p-4 flex flex-col justify-between gap-3 hover:border-brand/40 transition-all active:scale-[0.99] border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-brand/15 flex items-center justify-center text-brand-700 dark:text-brand shrink-0">
                                            <ArrowUpRight size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                                    {ride.passenger_name || 'Passageiro Mobipro'}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                    · {new Date(ride.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {ride.distance_km} km percorrido
                                            </p>
                                        </div>
                                    </div>

                                    {/* Valor Líquido Recebido */}
                                    <div className="text-right shrink-0">
                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(ride.fare_amount)}
                                        </p>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Creditado
                                        </span>
                                    </div>
                                </div>

                                {/* Discriminação de Desconto / Tipo de Corrida */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-800 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        {ride.is_particular ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                <QrCode size={10} /> Particular (-20% taxa)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-teal-500/20">
                                                <FileText size={10} /> Voucher Corporativo
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                        {ride.is_particular ? (
                                            <span>
                                                Bruto: {formatCurrency(ride.gross_fare)} · Desc: -{formatCurrency(ride.discount_amount)}
                                            </span>
                                        ) : (
                                            <span>Repasse integral: 100%</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <BottomNav />
        </div>
    );
}