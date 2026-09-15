'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  Flag,
  Star,
  XCircle,
  QrCode,
  DollarSign,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Loader2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { ChatModal } from '@/components/Ride/ChatModal';
import { ChatService } from '@/services/chat/ChatService';
import { PaymentCheckoutModal } from '@/components/Ride/PaymentCheckoutModal';
import { NavigationModal } from '@/components/NavigationModal';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { RideService } from '@/services/ride/RideService';
import { createClient } from '@/lib/supabase';
import { formatBRL } from '@/lib/utils';
import type { Ride, RideStatus } from '@/lib/types';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function DetalheCorrida() {
  const router = useRouter();
  const params = useParams();
  const urlId = params?.id as string;
  const { state, dispatch } = useApp();
  const { user } = useAuth();

  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isNavModalOpen, setNavModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [dbRide, setDbRide] = useState<Ride | null>(null);
  const [loadingDbRide, setLoadingDbRide] = useState(false);

  // Sistema de avaliação para corridas do histórico
  const [historyRating, setHistoryRating] = useState<number>(5);
  const [historyRatingSubmitted, setHistoryRatingSubmitted] = useState(false);

  // Busca corrida do store ativo, do histórico ou do banco
  const activeRide = state?.activeRide?.id === urlId ? state.activeRide : state?.activeRide;
  const historyRide = state?.rideHistory?.find((r) => r.id === urlId) || null;
  const currentRide: Ride | null = activeRide || historyRide || dbRide;

  const isRideActive =
    state.activeRide?.id === currentRide?.id &&
    currentRide?.status !== 'completed' &&
    currentRide?.status !== 'cancelled';
  const { location } = useDriverLocation(isRideActive, user?.id, currentRide?.id);

  // Busca do Supabase se recarregar a página direto no link
  useEffect(() => {
    if (!currentRide && urlId) {
      setLoadingDbRide(true);
      const supabase = createClient();

      const parseAndSet = (data: any) => {
        const parsed = RideService.parseDbRideToRide(data);
        setDbRide(parsed);
      };

      supabase
        .from('rides')
        .select('*')
        .eq('id', urlId)
        .maybeSingle()
        .then((res: any) => {
          if (res?.data) {
            parseAndSet(res.data);
            setLoadingDbRide(false);
          } else {
            supabase
              .from('corridas')
              .select('*')
              .eq('id', urlId)
              .maybeSingle()
              .then((corridaRes: any) => {
                if (corridaRes?.data) {
                  parseAndSet(corridaRes.data);
                }
                setLoadingDbRide(false);
              })
              .catch(() => setLoadingDbRide(false));
          }
        })
        .catch(() => {
          supabase
            .from('corridas')
            .select('*')
            .eq('id', urlId)
            .maybeSingle()
            .then((corridaRes: any) => {
              if (corridaRes?.data) {
                parseAndSet(corridaRes.data);
              }
              setLoadingDbRide(false);
            })
            .catch(() => setLoadingDbRide(false));
        });
    }
  }, [currentRide, urlId]);

  // Monitora mensagens do passageiro em tempo real
  useEffect(() => {
    if (!currentRide?.id) return;
    const unsubscribe = ChatService.subscribeToRideMessages(currentRide.id, (msg) => {
      if (msg.sender_role === 'passenger' && !isChatModalOpen) {
        setUnreadMessages((prev) => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [currentRide?.id, isChatModalOpen]);

  if (loadingDbRide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-xs font-bold text-slate-500">Carregando detalhes da corrida...</p>
        </div>
      </div>
    );
  }

  if (!currentRide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 dark:bg-dark-800 text-slate-400">
            <XCircle size={28} />
          </div>
          <h2 className="mb-1 text-lg font-black">Corrida não encontrada</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Nenhuma informação disponível para este identificador.</p>
          <button
            onClick={() => router.push('/corridas')}
            className="rounded-2xl bg-brand px-6 py-3 text-xs font-black text-slate-950 shadow-lg shadow-brand/20 transition hover:brightness-105 active:scale-95"
          >
            Voltar às Corridas
          </button>
        </div>
      </div>
    );
  }

  const isGoingToDropoff = currentRide.status === 'arrived' || currentRide.status === 'in-progress';
  const navAddress = isGoingToDropoff ? currentRide.dropoff : currentRide.pickup;
  const navCoords = isGoingToDropoff ? currentRide.dropoffCoordinates : currentRide.pickupCoordinates;
  const navLabel = isGoingToDropoff ? 'Navegar ao Destino' : 'Navegar ao Embarque';
  const routeMode = currentRide.status === 'accepted' ? 'to-pickup' : isGoingToDropoff ? 'to-dropoff' : 'full';

  const isCancelled = currentRide.status === 'cancelled';
  const isCompleted = currentRide.status === 'completed';
  const isCancelledByPassenger =
    currentRide.cancelledBy === 'passenger' ||
    (currentRide.cancelReason && /passageiro|cliente/i.test(currentRide.cancelReason));
  const isCancelledByDriver =
    currentRide.cancelledBy === 'driver' ||
    (currentRide.cancelReason && /motorista/i.test(currentRide.cancelReason));

  const handleArriveAtPickup = async () => {
    setLoadingAction(true);
    try {
      if (currentRide.id) {
        await RideService.arriveAtPickup(currentRide.id);
      }
      dispatch({ type: 'ARRIVE_AT_PICKUP' });
    } catch (err) {
      console.warn('[DetalheCorrida] Erro ao registrar chegada:', err);
      dispatch({ type: 'ARRIVE_AT_PICKUP' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartTrip = async () => {
    setLoadingAction(true);
    try {
      if (currentRide.id) {
        await RideService.startRide(currentRide.id);
      }
      dispatch({ type: 'START_RIDE' });
    } catch (err) {
      console.warn('[DetalheCorrida] Erro ao iniciar:', err);
      dispatch({ type: 'START_RIDE' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelActiveRide = async () => {
    const reason = window.prompt('Motivo do cancelamento (opcional):', 'Imprevisto do motorista');
    if (reason === null) return;

    setLoadingAction(true);
    try {
      if (currentRide.id) {
        await RideService.cancelRide(currentRide.id, user?.id, reason || 'Cancelado pelo motorista', 'driver');
      }
      dispatch({ type: 'CANCEL_RIDE' });
      router.push('/corridas');
    } catch (err) {
      console.warn('[DetalheCorrida] Erro ao cancelar:', err);
      dispatch({ type: 'CANCEL_RIDE' });
      router.push('/corridas');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFinishCheckout = async (data: {
    paymentMethod: 'pix' | 'cash' | 'card' | 'voucher';
    finalAmount: number;
    rating: number;
    ratingFeedback: string[];
    comments: string;
    voucherCode?: string;
  }) => {
    try {
      if (currentRide.id) {
        await RideService.completeRide(currentRide.id, user?.id, data.finalAmount);
      }
    } catch (err) {
      console.warn('[DetalheCorrida] Erro ao concluir:', err);
    }
    dispatch({ type: 'COMPLETE_RIDE' });
  };

  const handleRatePassengerHistory = () => {
    setHistoryRatingSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* CABEÇALHO */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-900/95 px-4 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/corridas')}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-dark-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-slate-900 dark:text-white">
              Corrida #{String(currentRide.id).slice(-6).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              {isRideActive ? (
                currentRide.status === 'accepted' ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock size={11} className="animate-spin" /> A caminho do embarque
                  </span>
                ) : currentRide.status === 'arrived' ? (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <MapPin size={11} /> No local de embarque (Aguardando passageiro)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Navigation size={11} className="animate-pulse" /> Em viagem até o destino
                  </span>
                )
              ) : isCompleted ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={11} /> Concluída com Sucesso
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle size={11} /> Cancelada
                </span>
              )}
            </div>
          </div>
          {currentRide.passengerRating != null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(currentRide.passengerRating).toFixed(1)}
            </div>
          )}
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-36">
        {/* BANNER DETALHADO SE CANCELADA */}
        {isCancelled && (
          <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-red-700 dark:text-red-300 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wide">
                  {isCancelledByPassenger
                    ? 'Cancelada pelo Passageiro'
                    : isCancelledByDriver
                    ? 'Cancelada pelo Motorista'
                    : 'Cancelada pela Central'}
                </span>
              </div>
              <span className="text-[10px] font-bold rounded-full bg-red-500/20 px-2 py-0.5 text-red-600 dark:text-red-300">
                Cancelamento Registrado
              </span>
            </div>
            {currentRide.cancelReason && (
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <strong>Justificativa:</strong> {currentRide.cancelReason}
              </p>
            )}
            {currentRide.cancelledAt && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Registrado em: {new Date(currentRide.cancelledAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {/* MAPA OPERACIONAL EM TEMPO REAL */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 px-4 py-2.5 bg-slate-50/50 dark:bg-dark-800/40">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
              <Navigation size={14} className="text-brand-600 dark:text-brand" />
              {currentRide.status === 'accepted' ? 'Trajeto até o Ponto de Embarque' : 'Trajeto da Corrida em Tempo Real'}
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
              GPS Ativo
            </span>
          </div>
          <div className="h-56 w-full overflow-hidden relative">
            <DriverMap
              location={location}
              pickupLocation={{
                latitude: currentRide.pickupCoordinates?.latitude ?? -3.1190,
                longitude: currentRide.pickupCoordinates?.longitude ?? -60.0217,
                label: 'EMBARQUE',
                address: currentRide.pickup,
              }}
              dropoffLocation={{
                latitude: currentRide.dropoffCoordinates?.latitude ?? -3.1072,
                longitude: currentRide.dropoffCoordinates?.longitude ?? -60.0125,
                label: 'DESTINO',
                address: currentRide.dropoff,
              }}
              showRoute={true}
              routeMode={routeMode}
            />
          </div>
        </div>

        {/* CARD VALOR & TEMPO */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Valor da Corrida
              </span>
              <div
                className={`text-3xl font-black tabular-nums ${
                  isCancelled ? 'text-slate-400 line-through' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatBRL(currentRide.fare)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Distância & Tempo
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {currentRide.distanceKm} km · {currentRide.estimatedMinutes} min
              </div>
            </div>
          </div>

          {/* Repasse e Método */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-dark-800 pt-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Repasse Motorista: <strong>100%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-black text-teal-700 dark:text-teal-400 uppercase border border-teal-500/30">
              <QrCode size={12} /> {currentRide.paymentMethod}
            </div>
          </div>
        </div>

        {/* CARD PASSAGEIRO */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-4 shadow-sm">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Passageiro
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-black text-slate-900 dark:text-white">
                {currentRide.passengerName}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passageiro verificado Mobipro 360
              </p>
            </div>
            {isRideActive && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setUnreadMessages(0);
                    setChatModalOpen(true);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/15 text-slate-900 dark:text-brand font-bold transition hover:bg-brand/25 active:scale-95"
                  aria-label="Chat com passageiro"
                >
                  <MessageCircle size={18} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-dark-900 animate-bounce">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <a
                  href="tel:+5592982329629"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-slate-950 font-bold shadow-md shadow-brand/20 transition hover:brightness-105"
                  aria-label="Ligar para o passageiro"
                >
                  <Phone size={18} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CARD DO TRAJETO */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-4 shadow-sm space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Trajeto da Viagem
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MapPin size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Origem / Embarque</div>
              <div className="text-xs font-bold leading-snug text-slate-900 dark:text-white">{currentRide.pickup}</div>
            </div>
          </div>

          <div className="my-1 ml-4 h-4 border-l-2 border-dashed border-slate-300 dark:border-dark-700" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
              <Navigation size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Destino Final</div>
              <div className="text-xs font-bold leading-snug text-slate-900 dark:text-white">{currentRide.dropoff}</div>
            </div>
          </div>
        </div>

        {/* SEÇÃO DE AVALIAÇÃO DO PASSAGEIRO (HISTÓRICO) */}
        {!isRideActive && !isCancelled && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avaliação do Passageiro
              </span>
              {historyRatingSubmitted && (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Avaliado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={historyRatingSubmitted}
                  onClick={() => setHistoryRating(star)}
                  className="p-1 transition transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= historyRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-dark-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {!historyRatingSubmitted && (
              <button
                type="button"
                onClick={handleRatePassengerHistory}
                className="w-full rounded-2xl bg-slate-100 dark:bg-dark-800 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-dark-700"
              >
                Salvar Avaliação ({historyRating} estrelas)
              </button>
            )}
          </div>
        )}
      </main>

      {/* FOOTER FIXO DE AÇÕES SE A CORRIDA ESTIVER ATIVA */}
      {isRideActive && (
        <footer className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-900/95 p-4 backdrop-blur-xl space-y-2">
          {/* Botão de Navegação Waze / Google Maps */}
          <button
            onClick={() => setNavModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-black text-slate-950 shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95"
          >
            <Navigation size={16} />
            {navLabel} (Waze / Maps)
            <ExternalLink size={13} className="opacity-80" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCancelActiveRide}
              disabled={loadingAction}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 py-3 text-xs font-bold text-red-600 dark:text-red-400 transition hover:bg-red-100 active:scale-95"
            >
              <XCircle size={15} /> Cancelar
            </button>

            {currentRide.status === 'accepted' && (
              <button
                onClick={handleArriveAtPickup}
                disabled={loadingAction}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 active:scale-95"
              >
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Cheguei ao Local
              </button>
            )}

            {currentRide.status === 'arrived' && (
              <button
                onClick={handleStartTrip}
                disabled={loadingAction}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95"
              >
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Iniciar Viagem
              </button>
            )}

            {currentRide.status === 'in-progress' && (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                disabled={loadingAction}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95"
              >
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} Finalizar Viagem
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Modal de Chat em Tempo Real com o Passageiro */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setChatModalOpen(false)}
        rideId={currentRide.id}
        passengerName={currentRide.passengerName}
        driverName={(user as any)?.user_metadata?.displayName || (user as any)?.user_metadata?.name || 'Motorista'}
        driverId={user?.id}
      />

      {/* Modal de Navegação (Waze / Google Maps) */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setNavModalOpen(false)}
        address={navAddress}
        coords={navCoords}
        destinationLabel={currentRide.status === 'in-progress' ? 'Destino' : 'Embarque'}
      />

      {/* Modal de Checkout / PIX QR Code e Avaliação */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        rideId={currentRide.id}
        fareAmount={currentRide.fare}
        passengerName={currentRide.passengerName}
        pickupAddress={currentRide.pickup}
        dropoffAddress={currentRide.dropoff}
        onFinishRide={handleFinishCheckout}
      />
    </div>
  );
}