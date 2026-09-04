'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Car,
  Clock3,
  MapPin,
  Navigation,
  ShieldCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useRideRequests } from '@/hooks/useRideRequests';
import { RideService } from '@/services/ride/RideService';
import { ProfileService } from '@/services/driver/ProfileService';
import { formatBRL } from '@/lib/utils';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function CorridasPage() {
  const router = useRouter();
  const { state, dispatch, todayEarnings, todayRides } = useApp();
  const { user, loading: authLoading } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [isLoadingTurno, setIsLoadingTurno] = useState(false);
  const { location } = useDriverLocation(isOnline);
  const { currentOffer, clearOffer } = useRideRequests(isOnline);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function syncStatus() {
      try {
        const profile = await ProfileService.getCurrentProfile();
        if (profile) {
          setIsOnline(profile.workStatus === 'ONLINE');
        }
      } catch (err) {
        console.warn('[Corridas] Erro ao sincronizar status:', err);
      }
    }
    if (user) {
      syncStatus();
    }
  }, [user]);

  const handleToggleTurno = async () => {
    setIsLoadingTurno(true);
    try {
      const nextStatus = !isOnline;
      await ProfileService.toggleWorkStatus(nextStatus ? 'ONLINE' : 'OFFLINE');
      setIsOnline(nextStatus);
    } catch (err) {
      console.warn('[Corridas] Falha ao atualizar status no banco:', err);
      setIsOnline((v) => !v);
    } finally {
      setIsLoadingTurno(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-brand" />
      </div>
    );
  }

  const handleAccept = async (rideId: string) => {
    const success = await RideService.acceptRide(rideId, user.id);
    if (success) {
      if (currentOffer) {
        dispatch({
          type: 'ACCEPT_RIDE'
        });
      }
      clearOffer();
      router.push(`/corridas/${rideId}`);
    } else {
      alert('Não foi possível aceitar esta corrida. Tente novamente.');
    }
  };

  const statusLabel = isOnline ? 'Disponível' : 'Offline';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] text-slate-900 dark:text-slate-50 transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-4 pt-safe-top backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-600 dark:text-brand">SR Logística</p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">Central de Corridas</h1>
          </div>
          <Badge className={isOnline ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold' : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold'}>
            <Activity size={12} className={isOnline ? 'animate-pulse text-emerald-500' : ''} />
            {statusLabel}
          </Badge>
        </div>
      </header>

      <main className="space-y-4 p-4 pb-28 flex-1">
        {/* CARDS DE RESUMO DO DIA */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet size={16} />
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Hoje</div>
            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatBRL(todayEarnings)}</div>
          </Card>

          <Card className="p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/20 text-brand-700 dark:text-brand">
              <Car size={16} />
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Corridas</div>
            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{todayRides}</div>
          </Card>

          <Card className="p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
              <TrendingUp size={16} />
            </div>
            <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Taxa</div>
            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">96,4%</div>
          </Card>
        </div>

        {/* MAPA OPERACIONAL */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-dark-700/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <Navigation size={15} className="text-brand-600 dark:text-brand" /> Mapa em tempo real
            </div>
            <Button
              size="sm"
              variant={isOnline ? 'outline' : 'primary'}
              disabled={isLoadingTurno}
              onClick={handleToggleTurno}
              className={!isOnline ? 'bg-brand text-slate-950 font-black hover:brightness-105' : ''}
            >
              {isLoadingTurno ? 'Atualizando...' : isOnline ? 'Encerrar turno' : 'Iniciar turno'}
            </Button>
          </div>
          <div className="h-64 overflow-hidden border-b border-slate-200/80 dark:border-dark-700/80">
            <DriverMap location={location} />
          </div>
        </div>

        {/* CHAMADA ATIVA / OFERTA */}
        {isOnline && currentOffer ? (
          <Card className="border border-brand-500/40 bg-gradient-to-br from-brand-500/10 via-white to-white dark:via-dark-900 dark:to-dark-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand">Nova solicitação</p>
                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{currentOffer.passengerName}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/20 text-brand-700 dark:text-brand">
                <Clock3 size={20} />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <MapPin size={12} className="text-emerald-500" /> Embarque
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{currentOffer.pickupAddress}</div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <Navigation size={12} className="text-red-500" /> Destino
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{currentOffer.dropoffAddress}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Valor</div>
                <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{formatBRL(Number(currentOffer.fareAmount ?? 0))}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tempo</div>
                <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">{currentOffer.estimatedMinutes} min</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" full onClick={() => clearOffer()}>
                Recusar
              </Button>
              <Button full onClick={() => handleAccept(currentOffer.id)}>
                Aceitar
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand-700 dark:text-brand">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Nenhuma solicitação ativa</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Ative o turno para receber corridas em tempo real.</div>
              </div>
            </div>
          </Card>
        )}

        {/* HISTÓRICO RECENTE */}
        <div>
          <SectionTitle className="mb-3">Histórico recente</SectionTitle>
          <div className="space-y-2.5">
            {state.rideHistory.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhuma corrida registrada hoje ainda.
              </Card>
            ) : (
              state.rideHistory.slice(0, 6).map((ride) => (
                <Card key={ride.id} className="flex items-center justify-between p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{ride.passengerName}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{ride.pickup} → {ride.dropoff}</div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatBRL(Number(ride.fare ?? 0))}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{ride.status}</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

