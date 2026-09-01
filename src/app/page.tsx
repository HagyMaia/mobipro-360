'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Car, MapPin, Navigation, TrendingUp, Trophy } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RentabilityOverlay from '@/components/RentabilityOverlay';
import RideRequestCard from '@/components/RideRequestCard';
import ActiveRideCard from '@/components/ActiveRideCard';
import StatusControl, { StatusPill } from '@/components/StatusControl';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp, useSimulateRide } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { buildMockRequest } from '@/lib/mock-data';
import { formatBRL, isToday } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = useApp();
  const { signOut } = useAuth();
  const simulate = useSimulateRide();
  const [tick, setTick] = useState(0);
  const [driverName, setDriverName] = useState('Motorista');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    async function checkAuthAndLoadProfile() {
      try {
        let user = null;
        try {
          const res = await supabase.auth.getUser();
          user = res.data?.user;
        } catch (authErr) {
          console.error('[App] Erro ao buscar usuário no Supabase:', authErr);
        }

        if (!user) {
          router.replace('/welcome');
          return;
        }

        try {
          const { data: motorista, error: dbError } = await supabase
            .from('motoristas')
            .select('nome')
            .eq('id', user.id)
            .maybeSingle();

          if (dbError) {
            console.error('[App] Erro ao buscar dados do motorista:', dbError);
          }

          if (motorista?.nome) {
            setDriverName(motorista.nome.split(' ')[0]);
          } else if (user.email) {
            setDriverName(user.email.split('@')[0]);
          }
        } catch (dbErr) {
          console.error('[App] Erro inesperado ao buscar motorista:', dbErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('[App] Falha crítica na verificação de auth:', err);
        router.replace('/welcome');
      }
    }

    checkAuthAndLoadProfile();
  }, [router]);

  const triggerRequest = useCallback(() => {
    counter.current += 1;
    simulate(() => buildMockRequest(counter.current));
  }, [simulate]);

  useEffect(() => {
    if (
      state.status === 'available' &&
      !state.incomingRide &&
      !state.activeRide &&
      tick < 40
    ) {
      const delay = 6000 + Math.random() * 9000;
      const timer = setTimeout(triggerRequest, delay);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.incomingRide, state.activeRide, tick, triggerRequest]);

  useEffect(() => {
    if (state.incomingRide && state.filters.autoReject) {
      const f = state.filters;
      const shouldReject =
        state.incomingRide.passengerRating < f.minRating ||
        state.incomingRide.passengerAccountMonths < f.minAccountMonths ||
        (f.rejectCash && state.incomingRide.paymentMethod === 'cash');
      if (shouldReject) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REJECT_RIDE' });
          setTick((t) => t + 1);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.incomingRide, state.filters, dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-900 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const todayEarningsTotal = state.earnings
    .filter((e) => isToday(e.date))
    .reduce((s, e) => s + e.amount, 0);

  const todayRidesCount = state.rideHistory.filter(
    (r) => r.completedAt && isToday(r.completedAt)
  ).length;

  const goalPct = Math.round((todayEarningsTotal / state.goalTarget) * 100);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-900/95 px-4 pb-3 pt-safe-top pt-4 backdrop-blur-md shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Olá, <span className="text-brand-400">{driverName}</span> 👋
            </h1>
            <p className="text-[11px] capitalize text-slate-400">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <StatusPill />
            <button
              type="button"
              aria-label="Notificações"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative rounded-full border border-dark-700 bg-dark-800 p-2 text-slate-300 transition hover:border-brand-500/40 hover:bg-dark-700 hover:text-white"
            >
              <Bell size={16} />
              {state.status === 'available' && state.incomingRide && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </div>
        {notificationsOpen && (
          <div className="mt-3 rounded-2xl border border-dark-700 bg-dark-800 px-3 py-2 text-xs text-slate-300 shadow-lg shadow-black/10">
            {state.incomingRide ? 'Você tem uma nova solicitação de corrida.' : 'Nenhuma notificação nova.'}
          </div>
        )}
      </header>

      <div className="space-y-4 p-4 pb-28">
        <StatusControl />

        {state.incomingRide ? (
          <RideRequestCard ride={state.incomingRide} />
        ) : state.activeRide ? (
          <ActiveRideCard />
        ) : state.status === 'available' ? (
          <Card className="flex flex-col items-center gap-4 border border-brand-500/20 bg-brand-500/10 py-10 text-center shadow-lg shadow-brand-900/10">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/10 delay-500" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/15 ring-2 ring-brand-500/30">
                <Navigation size={32} className="text-brand-400" />
              </div>
            </div>
            <div>
              <div className="font-bold text-white">Procurando corridas...</div>
              <div className="mt-1 text-xs text-slate-400">
                Fique atento às novas chamadas e ao filtro de rentabilidade.
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border border-dark-700 bg-dark-800 py-10 text-center">
            <EmptyState
              icon={<MapPin size={28} className="text-slate-500" />}
              title={state.status === 'break' ? 'Você está em pausa' : 'Você está offline'}
              description="Ative o modo Disponível para receber corridas."
            />
          </Card>
        )}

        <div>
          <SectionTitle className="mb-3 text-slate-400">Resumo do dia</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center gap-1.5 border border-dark-700 bg-dark-800 p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Rendimento</div>
              <div className="text-base font-extrabold tabular-nums text-white">{formatBRL(todayEarningsTotal)}</div>
            </Card>

            <Card className="flex flex-col items-center gap-1.5 border border-dark-700 bg-dark-800 p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15">
                <Car size={16} className="text-brand-400" />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Corridas</div>
              <div className="text-base font-extrabold tabular-nums text-white">{todayRidesCount}</div>
            </Card>

            <Card className="flex flex-col items-center gap-1.5 border border-dark-700 bg-dark-800 p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
                <Trophy size={16} className="text-amber-300" />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Meta</div>
              <div className={`text-base font-extrabold tabular-nums ${goalPct >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                {goalPct}%
              </div>
            </Card>
          </div>
        </div>
      </div>

      <RentabilityOverlay />
      <BottomNav />
    </>
  );
}