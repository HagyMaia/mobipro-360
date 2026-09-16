'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  Car,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserX,
  Wallet,
  XCircle,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useRideRequests } from '@/hooks/useRideRequests';
import { useActiveRideSync } from '@/hooks/useActiveRideSync';
import { RideService } from '@/services/ride/RideService';
import { ProfileService } from '@/services/driver/ProfileService';
import { formatBRL } from '@/lib/utils';
import type { Ride } from '@/lib/types';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function CorridasPage() {
  const router = useRouter();
  const { state, dispatch, todayEarnings, todayRides } = useApp();
  const { user, loading: authLoading } = useAuth();

  useActiveRideSync();

  const [isOnline, setIsOnline] = useState(false);
  const [isLoadingTurno, setIsLoadingTurno] = useState(false);
  const [dbHistory, setDbHistory] = useState<Ride[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Regra de Negócio: Foco na corrida atual - após aceitar, para de buscar/tocar novas chamadas
  const isAvailableForNewRides = (isOnline || state.status === 'available') && !state.activeRide;
  const isLocationTrackingActive = Boolean(isOnline || state.status === 'available' || state.activeRide);

  const { location } = useDriverLocation(isLocationTrackingActive, user?.id, state.activeRide?.id);
  const { currentOffer, clearOffer, rejectOffer } = useRideRequests(
    isAvailableForNewRides,
    state.destinationFilter,
    state.profile?.driverType
  );

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

  // Carrega histórico completo de corridas e cancelamentos do Supabase
  const loadHistory = useMemo(() => {
    return async () => {
      setLoadingHistory(true);
      try {
        const history = await RideService.getDriverRidesHistory(user?.id);
        setDbHistory(history);
      } catch (err) {
        console.error('[Corridas] Erro ao carregar histórico:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, state.activeRide, loadHistory]);

  // Junta o histórico do store com o histórico do banco de dados sem duplicatas
  const combinedHistory = useMemo(() => {
    const list: Ride[] = [...state.rideHistory];
    const seenIds = new Set(list.map((r) => r.id));

    for (const item of dbHistory) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        list.push(item);
      }
    }

    list.sort((a, b) => {
      const timeA = new Date(a.completedAt || a.cancelledAt || a.requestedAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.cancelledAt || b.requestedAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [state.rideHistory, dbHistory]);

  const isStatusCancelled = (status?: string) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'cancelled' || s === 'cancelada' || s === 'canceled' || s === 'recusada' || s === 'rejected' || s === 'aborted';
  };

  const isStatusCompleted = (status?: string) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'completed' || s === 'concluida' || s === 'finalizada' || s === 'finished';
  };

  const filteredHistory = useMemo(() => {
    if (filterTab === 'completed') {
      return combinedHistory.filter((r) => isStatusCompleted(r.status));
    }
    if (filterTab === 'cancelled') {
      return combinedHistory.filter((r) => isStatusCancelled(r.status));
    }
    return combinedHistory;
  }, [combinedHistory, filterTab]);

  const handleToggleTurno = async () => {
    if (state.activeRide) {
      setStatusError('Você está com uma corrida em andamento. Finalize ou cancele a viagem antes de encerrar o turno.');
      return;
    }

    setStatusError(null);
    setIsLoadingTurno(true);
    try {
      const nextStatus = !isOnline;
      await ProfileService.toggleWorkStatus(nextStatus ? 'ONLINE' : 'OFFLINE');
      setIsOnline(nextStatus);
      dispatch({ type: 'SET_STATUS', status: nextStatus ? 'available' : 'offline' });
    } catch (err) {
      console.warn('[Corridas] Falha ao atualizar status no banco:', err);
      setIsOnline((v) => !v);
      dispatch({ type: 'SET_STATUS', status: !isOnline ? 'available' : 'offline' });
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
    try {
      await RideService.acceptRide(rideId, user.id);
      if (currentOffer) {
        dispatch({
          type: 'ACCEPT_RIDE',
          ride: {
            id: currentOffer.id,
            passengerName: currentOffer.passengerName,
            passengerRating: currentOffer.passengerRating,
            passengerAccountMonths: 6,
            passengerTrips: 18,
            pickup: currentOffer.pickupAddress,
            dropoff: currentOffer.dropoffAddress,
            pickupCoordinates: currentOffer.pickupLocation,
            dropoffCoordinates: currentOffer.dropoffLocation,
            distanceKm: currentOffer.distanceKm,
            estimatedMinutes: currentOffer.estimatedMinutes,
            fare: currentOffer.fareAmount,
            paymentMethod: (currentOffer.paymentMethod as any) || 'pix',
            requestedAt: new Date().toISOString(),
            source: 'app',
          },
        });
      }
      clearOffer();
      router.push(`/corridas/${rideId}`);
    } catch (err) {
      console.error('[Corridas] Erro ao aceitar:', err);
      clearOffer();
      router.push(`/corridas/${rideId}`);
    }
  };

  const statusLabel = state.activeRide
    ? 'Em Corrida (Bloqueado)'
    : isOnline
    ? 'Disponível'
    : 'Offline';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] text-slate-900 dark:text-slate-50 transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-4 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-600 dark:text-brand">SR Logística</p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">Central de Corridas</h1>
          </div>
          <Badge
            className={
              state.activeRide
                ? 'border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                : isOnline
                ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold'
            }
          >
            {state.activeRide ? (
              <Lock size={12} className="text-amber-500" />
            ) : (
              <Activity size={12} className={isOnline ? 'animate-pulse text-emerald-500' : ''} />
            )}
            {statusLabel}
          </Badge>
        </div>
      </header>

      <main className="space-y-4 p-4 pb-28 flex-1">
        {statusError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{statusError}</span>
          </div>
        )}

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
              disabled={isLoadingTurno || Boolean(state.activeRide)}
              onClick={handleToggleTurno}
              className={
                state.activeRide
                  ? 'opacity-50 cursor-not-allowed'
                  : !isOnline
                  ? 'bg-brand text-slate-950 font-black hover:brightness-105'
                  : ''
              }
            >
              {isLoadingTurno
                ? 'Atualizando...'
                : state.activeRide
                ? 'Em corrida'
                : isOnline
                ? 'Encerrar turno'
                : 'Iniciar turno'}
            </Button>
          </div>
          <div className="h-64 overflow-hidden border-b border-slate-200/80 dark:border-dark-700/80">
            <DriverMap
              location={location}
              pickupLocation={
                currentOffer
                  ? {
                      latitude: currentOffer.pickupLocation.latitude,
                      longitude: currentOffer.pickupLocation.longitude,
                      label: 'EMBARQUE',
                      address: currentOffer.pickupAddress,
                    }
                  : state.activeRide
                  ? {
                      latitude: state.activeRide.pickupCoordinates?.latitude ?? -3.1190,
                      longitude: state.activeRide.pickupCoordinates?.longitude ?? -60.0217,
                      label: 'EMBARQUE',
                      address: state.activeRide.pickup,
                    }
                  : null
              }
              dropoffLocation={
                currentOffer
                  ? {
                      latitude: currentOffer.dropoffLocation.latitude,
                      longitude: currentOffer.dropoffLocation.longitude,
                      label: 'DESTINO',
                      address: currentOffer.dropoffAddress,
                    }
                  : state.activeRide
                  ? {
                      latitude: state.activeRide.dropoffCoordinates?.latitude ?? -3.1072,
                      longitude: state.activeRide.dropoffCoordinates?.longitude ?? -60.0125,
                      label: 'DESTINO',
                      address: state.activeRide.dropoff,
                    }
                  : null
              }
              showRoute={Boolean(currentOffer || state.activeRide)}
              routeMode={
                state.activeRide?.status === 'accepted'
                  ? 'to-pickup'
                  : state.activeRide?.status === 'arrived' || state.activeRide?.status === 'in-progress'
                  ? 'to-dropoff'
                  : 'full'
              }
            />
          </div>
        </div>

        {/* CHAMADA ATIVA / OFERTA (Apenas quando não houver corrida em andamento) */}
        {!state.activeRide && isOnline && currentOffer ? (
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

            {(() => {
              const isVoucher = String(currentOffer.paymentMethod).toLowerCase() === 'voucher';
              const grossFare = Number(currentOffer.fareAmount ?? 0);
              const netFare = isVoucher ? grossFare : Number((grossFare * 0.80).toFixed(2));

              return (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {isVoucher ? 'Ganho (Voucher)' : 'Ganho Líquido (-20%)'}
                      </div>
                      <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatBRL(netFare)}
                      </div>
                      {!isVoucher && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Bruto: {formatBRL(grossFare)}
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50 dark:bg-dark-800/60 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tempo</div>
                      <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">{currentOffer.estimatedMinutes} min</div>
                      <div className="text-[10px] text-slate-400 font-medium">{currentOffer.distanceKm} km</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      full
                      onClick={() => {
                        if (currentOffer?.id) {
                          rejectOffer(currentOffer.id);
                        } else {
                          clearOffer();
                        }
                      }}
                    >
                      Recusar
                    </Button>
                    <Button full onClick={() => handleAccept(currentOffer.id)}>
                      Aceitar
                    </Button>
                  </div>
                </>
              );
            })()}
          </Card>
        ) : !state.activeRide ? (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/15 text-brand-700 dark:text-brand">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isOnline ? 'Radar ativo · Aguardando novas corridas' : 'Turno encerrado'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isOnline ? 'Suas viagens aparecerão aqui em tempo real.' : 'Inicie o turno para receber chamadas.'}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* HISTÓRICO COMPLETO DE CORRIDAS E CANCELAMENTOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SectionTitle className="mb-0">Histórico de Corridas</SectionTitle>
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                title="Recarregar histórico"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-500 dark:text-slate-400 transition"
              >
                <RefreshCw size={13} className={loadingHistory ? 'animate-spin text-brand' : ''} />
              </button>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* Abas de Filtro */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-dark-900 p-1 border border-slate-200/80 dark:border-dark-700/80 text-xs font-bold">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Todas ({combinedHistory.length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === 'completed'
                  ? 'bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Concluídas ({combinedHistory.filter((r) => isStatusCompleted(r.status)).length})
            </button>
            <button
              onClick={() => setFilterTab('cancelled')}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === 'cancelled'
                  ? 'bg-white dark:bg-dark-800 text-red-600 dark:text-red-400 shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Canceladas ({combinedHistory.filter((r) => isStatusCancelled(r.status)).length})
            </button>
          </div>

          {/* Lista de Registros */}
          <div className="space-y-2.5">
            {loadingHistory ? (
              <Card className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand" /> Carregando histórico de viagens...
              </Card>
            ) : filteredHistory.length === 0 ? (
              <Card className="border-dashed p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                {filterTab === 'completed'
                  ? 'Nenhuma corrida concluída encontrada.'
                  : filterTab === 'cancelled'
                  ? 'Nenhum cancelamento registrado.'
                  : 'Nenhuma corrida registrada ainda.'}
              </Card>
            ) : (
              filteredHistory.map((ride) => {
                const isCancelled = isStatusCancelled(ride.status);
                const isCompleted = isStatusCompleted(ride.status);
                const isCancelledByPassenger =
                  ride.cancelledBy === 'passenger' ||
                  (ride.cancelReason && /passageiro|cliente/i.test(ride.cancelReason));
                const isCancelledByDriver =
                  ride.cancelledBy === 'driver' ||
                  (ride.cancelReason && /motorista/i.test(ride.cancelReason));

                const dateStr = ride.requestedAt
                  ? new Date(ride.requestedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <button
                    key={ride.id}
                    onClick={() => router.push(`/corridas/${ride.id}`)}
                    className="w-full text-left group"
                  >
                    <Card className="p-3.5 transition hover:border-brand/60 active:scale-99 border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-black text-slate-900 dark:text-white">
                              {ride.passengerName}
                            </span>
                            {dateStr && (
                              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                · {dateStr}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badge de Status / Autor de Cancelamento */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Concluída
                          </span>
                        ) : isCancelled ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black shrink-0 border ${
                              isCancelledByPassenger
                                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                                : isCancelledByDriver
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                            }`}
                          >
                            <XCircle size={11} />
                            {isCancelledByPassenger
                              ? 'Cancelada pelo Passageiro'
                              : isCancelledByDriver
                              ? 'Cancelada pelo Motorista'
                              : 'Cancelada pela Central'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-black text-brand-700 dark:text-brand shrink-0">
                            Em andamento
                          </span>
                        )}
                      </div>

                      {/* Origem e Destino */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                          <MapPin size={12} className="text-emerald-500 shrink-0" />
                          <span className="truncate font-medium">{ride.pickup}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                          <Navigation size={12} className="text-red-500 shrink-0" />
                          <span className="truncate font-medium">{ride.dropoff}</span>
                        </div>
                      </div>

                      {/* Motivo do Cancelamento se houver */}
                      {isCancelled && ride.cancelReason && (
                        <div className="mt-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 p-2 text-[11px] text-red-700 dark:text-red-300 font-medium">
                          <strong>Motivo:</strong> {ride.cancelReason}
                        </div>
                      )}

                      {/* Linha inferior com Valor e Distância */}
                      {(() => {
                        const isVoucher = String(ride.paymentMethod).toLowerCase() === 'voucher';
                        const grossFare = Number(ride.fare ?? 0);
                        const netFare = isVoucher ? grossFare : Number((grossFare * 0.80).toFixed(2));

                        return (
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-dark-800 pt-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-500 dark:text-slate-400">
                                {ride.distanceKm} km · {ride.estimatedMinutes} min
                              </span>
                              {isCompleted && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isVoucher ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {isVoucher ? 'Voucher' : '-20% taxa'}
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-black tabular-nums text-sm ${
                                isCompleted
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isCancelled
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {formatBRL(isCompleted ? netFare : grossFare)}
                            </span>
                          </div>
                        );
                      })()}
                    </Card>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
