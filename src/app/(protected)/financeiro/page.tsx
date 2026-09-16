'use client';

import { useEffect, useState, useMemo } from 'react';
import { FinanceService, DriverEarningsSummary, DriverFinancialRide } from '@/services/finance/FinanceService';
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
    Calendar,
    Filter,
    Clock,
    CheckCircle2,
    RefreshCw,
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
    const [filterTab, setFilterTab] = useState<'today' | 'other' | 'all'>('today');
    const [specificDate, setSpecificDate] = useState<string>('');

    const fetchFinance = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            const result = await FinanceService.getDriverEarnings(data?.user?.id);
            setEarnings(result);
        } catch (err: any) {
            console.error('[Financeiro] Erro ao carregar carteira:', err);
            setError('Não foi possível carregar as informações financeiras. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinance();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0);
    };

    // Filtro Dinâmico de Corridas por Data
    const { filteredRides, todayCount, otherCount, allCount } = useMemo(() => {
        const todayStr = new Date().toDateString();
        const all = earnings.rides || [];

        let todayRidesList: DriverFinancialRide[] = [];
        let otherRidesList: DriverFinancialRide[] = [];

        for (const ride of all) {
            const rideDate = new Date(ride.created_at);
            if (rideDate.toDateString() === todayStr) {
                todayRidesList.push(ride);
            } else {
                otherRidesList.push(ride);
            }
        }

        let selectedList: DriverFinancialRide[] = [];

        if (filterTab === 'today') {
            selectedList = todayRidesList;
        } else if (filterTab === 'other') {
            if (specificDate) {
                // Filtra por data específica se fornecida (AAAA-MM-DD)
                selectedList = otherRidesList.filter((r) => {
                    const d = new Date(r.created_at);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    return isoDate === specificDate;
                });
            } else {
                selectedList = otherRidesList;
            }
        } else {
            selectedList = all;
        }

        return {
            filteredRides: selectedList,
            todayCount: todayRidesList.length,
            otherCount: otherRidesList.length,
            allCount: all.length,
        };
    }, [earnings.rides, filterTab, specificDate]);

    // Totais calculados dinamicamente para o período selecionado
    const dynamicTotals = useMemo(() => {
        const totalEarned = filteredRides.reduce((acc, r) => acc + r.fare_amount, 0);
        const grossTotal = filteredRides.reduce((acc, r) => acc + r.gross_fare, 0);
        const totalDiscount = filteredRides.reduce((acc, r) => acc + r.discount_amount, 0);
        const voucherCount = filteredRides.filter((r) => !r.is_particular).length;
        const particularCount = filteredRides.filter((r) => r.is_particular).length;

        return {
            totalEarned: Number(totalEarned.toFixed(2)),
            grossTotal: Number(grossTotal.toFixed(2)),
            totalDiscount: Number(totalDiscount.toFixed(2)),
            voucherCount,
            particularCount,
        };
    }, [filteredRides]);

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
        <div className="min-h-screen bg-[color:var(--bg)] text-slate-900 dark:text-slate-100 p-4 pb-28 transition-colors">
            <header className="mb-4 pt-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Carteira & Ganhos</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Saldo líquido, repasses integrais e extrato detalhado
                    </p>
                </div>
                <button
                    onClick={fetchFinance}
                    title="Atualizar dados financeiros"
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 transition active:scale-95 shadow-sm"
                >
                    <RefreshCw size={15} />
                </button>
            </header>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-red-600 dark:text-red-400 border border-red-500/20">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* SELETOR DE ABAS DE FILTRO DE DATA */}
            <div className="mb-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <Calendar size={14} className="text-brand-600 dark:text-brand" />
                    <span>Filtrar por Período:</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/60 dark:bg-dark-900 p-1 border border-slate-200/80 dark:border-dark-700/80 text-xs font-bold">
                    <button
                        onClick={() => {
                            setFilterTab('today');
                            setSpecificDate('');
                        }}
                        className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 ${
                            filterTab === 'today'
                                ? 'bg-white dark:bg-dark-800 text-slate-950 dark:text-white shadow-sm font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Hoje</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300">
                            {todayCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setFilterTab('other')}
                        className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 ${
                            filterTab === 'other'
                                ? 'bg-white dark:bg-dark-800 text-slate-950 dark:text-white shadow-sm font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Outros Dias</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300">
                            {otherCount}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setFilterTab('all');
                            setSpecificDate('');
                        }}
                        className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 ${
                            filterTab === 'all'
                                ? 'bg-white dark:bg-dark-800 text-slate-950 dark:text-white shadow-sm font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <span>Todas</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300">
                            {allCount}
                        </span>
                    </button>
                </div>

                {/* Seletor de data específica quando na aba "Outros Dias" */}
                {filterTab === 'other' && (
                    <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-dark-900 p-2.5 border border-slate-200/80 dark:border-dark-700/80 animate-in fade-in">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                            Selecionar dia:
                        </span>
                        <input
                            type="date"
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand"
                        />
                        {specificDate && (
                            <button
                                onClick={() => setSpecificDate('')}
                                className="text-xs font-bold text-slate-500 hover:text-red-500 px-2 py-1"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Card de Saldo Líquido Principal */}
            <div className="relative overflow-hidden rounded-3xl bg-brand p-6 text-slate-950 shadow-xl shadow-brand/25 transition-all">
                <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-950/80 font-black">
                            <Wallet size={18} />
                            <span className="text-xs uppercase tracking-wider">
                                {filterTab === 'today'
                                    ? 'Ganhos Líquidos de Hoje'
                                    : filterTab === 'other'
                                    ? specificDate ? `Ganhos em ${new Date(specificDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Ganhos em Outros Dias'
                                    : 'Saldo Líquido Acumulado Geral'}
                            </span>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-black/15 text-slate-950 px-2.5 py-0.5 rounded-full">
                            {filteredRides.length} {filteredRides.length === 1 ? 'viagem' : 'viagens'}
                        </span>
                    </div>

                    <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                        {formatCurrency(dynamicTotals.totalEarned)}
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-950">
                        <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full">
                            <span>Bruto: <strong>{formatCurrency(dynamicTotals.grossTotal)}</strong></span>
                        </div>
                        {dynamicTotals.totalDiscount > 0 && (
                            <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full text-slate-900">
                                <span>Taxa retida (-20% part.): <strong>-{formatCurrency(dynamicTotals.totalDiscount)}</strong></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resumo de Repasses & Regras de Desconto */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <Card className="p-3.5 border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <QrCode size={12} className="text-amber-500" /> Particular (PIX)
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            {dynamicTotals.particularCount} {dynamicTotals.particularCount === 1 ? 'corrida' : 'corridas'}
                        </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                        20% taxa plataforma
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Líquido ao motorista: <strong className="text-emerald-600 dark:text-emerald-400">80% da tarifa</strong>
                    </p>
                </Card>

                <Card className="p-3.5 border border-teal-500/30 dark:border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent dark:from-teal-950/30 bg-white dark:bg-dark-900 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                            <ShieldCheck size={12} className="text-teal-500" /> Voucher Convênio
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-400">
                            {dynamicTotals.voucherCount} {dynamicTotals.voucherCount === 1 ? 'corrida' : 'corridas'}
                        </span>
                    </div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        100% Repasse Integral
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Zero desconto · Tarifa cheia ao motorista
                    </p>
                </Card>
            </div>

            {/* Extrato Detalhado de Corridas com Filtro Aplicado */}
            <section className="mt-7">
                <div className="flex items-center justify-between mb-3">
                    <SectionTitle className="flex items-center gap-2 mb-0">
                        <History size={18} className="text-brand-600 dark:text-brand" /> Extrato Detalhado
                    </SectionTitle>
                    <span className="text-xs font-bold text-slate-400">
                        {filteredRides.length} {filteredRides.length === 1 ? 'corrida encontrada' : 'corridas encontradas'}
                    </span>
                </div>

                {filteredRides.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed border-slate-200 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                            <History size={24} />
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {filterTab === 'today'
                                ? 'Nenhuma corrida concluída hoje.'
                                : filterTab === 'other'
                                ? 'Nenhuma corrida encontrada no filtro de outros dias.'
                                : 'Nenhuma corrida concluída registrada.'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                            Suas viagens concluídas aparecerão aqui com o cálculo automático de repasse líquido.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredRides.map((ride) => {
                            const isVoucher = !ride.is_particular;
                            const dateObj = new Date(ride.created_at);
                            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                            });
                            const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                            return (
                                <Card
                                    key={ride.id}
                                    className="p-4 flex flex-col justify-between gap-3 hover:border-brand/40 transition-all border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                                                    isVoucher
                                                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/20'
                                                        : 'bg-brand/20 text-brand-700 dark:text-brand'
                                                }`}
                                            >
                                                {isVoucher ? <FileText size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                        {ride.passenger_name || 'Passageiro Mobipro'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-0.5">
                                                    <Clock size={11} />
                                                    <span>{formattedDate} às {formattedTime}</span>
                                                    <span>· {ride.distance_km} km</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Valor Líquido Creditado */}
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(ride.fare_amount)}
                                            </p>
                                            <span className="text-[10px] font-black uppercase text-slate-400">
                                                {isVoucher ? 'Repasse 100%' : 'Líquido (-20%)'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Origem e Destino resumidos se disponíveis */}
                                    {(ride.pickup_address || ride.dropoff_address) && (
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-dark-800 pt-2">
                                            {ride.pickup_address && (
                                                <div className="truncate font-medium">
                                                    <span className="text-slate-400">De:</span> {ride.pickup_address}
                                                </div>
                                            )}
                                            {ride.dropoff_address && (
                                                <div className="truncate font-medium">
                                                    <span className="text-slate-400">Para:</span> {ride.dropoff_address}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Discriminação da Forma de Pagamento e Taxa */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-800 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            {isVoucher ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-black text-teal-700 dark:text-teal-400 border border-teal-500/20">
                                                    <ShieldCheck size={11} /> Voucher Convênio Empresa (100% Repasse)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                    <QrCode size={11} /> Particular (PIX - Taxa 20%)
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                            {isVoucher ? (
                                                <span className="text-teal-600 dark:text-teal-400 font-black">
                                                    Sem desconto retido
                                                </span>
                                            ) : (
                                                <span>
                                                    Bruto: {formatCurrency(ride.gross_fare)} · Taxa: -{formatCurrency(ride.discount_amount)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            <BottomNav />
        </div>
    );
}