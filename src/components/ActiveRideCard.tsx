// src/components/ActiveRideCard.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Flag, Loader2, MapPin, Navigation, Phone, Play, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { RideService } from '@/services/ride/RideService';
import { formatBRL } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';
import { NavigationModal } from '@/components/NavigationModal';
import { PaymentCheckoutModal } from '@/components/Ride/PaymentCheckoutModal';

const STEPS = [
  { key: 'accepted', label: 'A caminho' },
  { key: 'arrived', label: 'No local' },
  { key: 'in-progress', label: 'Em viagem' },
  { key: 'completed', label: 'Finalizada' }
] as const;

export default function ActiveRideCard() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = useState(false);
  const [isNavModalOpen, setNavModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);

  const ride = state.activeRide;
  if (!ride) return null;

  const stepIndex = STEPS.findIndex((s) => s.key === ride.status);
  const navApp = state.navApp ?? 'waze';

  // Endereço alvo de navegação:
  // - "accepted" (a caminho) → navegar até o PICKUP (embarque)
  // - "arrived" / "in-progress" → navegar até o DROPOFF (destino)
  const isGoingToDropoff = ride.status === 'arrived' || ride.status === 'in-progress';
  const navAddress = isGoingToDropoff ? ride.dropoff : ride.pickup;
  const navCoords = isGoingToDropoff ? ride.dropoffCoordinates : ride.pickupCoordinates;
  const navLabel = isGoingToDropoff ? 'Navegar ao Destino' : 'Navegar ao Embarque';
  const navAppLabel = navApp === 'waze' ? 'Waze' : 'Google Maps';

  async function handleArrived() {
    if (ride?.id) {
      setLoadingAction(true);
      try {
        await RideService.arriveAtPickup(ride.id);
      } catch (err) {
        console.warn('[ActiveRideCard] Erro ao registrar chegada no local:', err);
      } finally {
        setLoadingAction(false);
      }
    }
    dispatch({ type: 'ARRIVE_AT_PICKUP' });
  }

  async function handleStart() {
    if (ride?.id) {
      setLoadingAction(true);
      try {
        await RideService.startRide(ride.id);
      } catch (err) {
        console.warn('[ActiveRideCard] Erro ao iniciar corrida no banco:', err);
      } finally {
        setLoadingAction(false);
      }
    }
    dispatch({ type: 'START_RIDE' });
  }

  async function handleFinishCheckout(data: {
    paymentMethod: 'pix' | 'cash' | 'card' | 'voucher';
    finalAmount: number;
    rating: number;
    ratingFeedback: string[];
    comments: string;
    voucherCode?: string;
  }) {
    if (ride?.id) {
      try {
        await RideService.completeRide(ride.id, user?.id, data.finalAmount);
      } catch (err) {
        console.warn('[ActiveRideCard] Erro ao finalizar corrida no banco:', err);
      }
    }
    dispatch({ type: 'COMPLETE_RIDE' });
  }

  async function handleCancel() {
    if (!window.confirm('Tem certeza que deseja cancelar esta corrida?')) {
      return;
    }

    if (ride?.id) {
      setLoadingAction(true);
      try {
        await RideService.cancelRide(ride.id, user?.id);
      } catch (err) {
        console.warn('[ActiveRideCard] Erro ao cancelar corrida no banco:', err);
      } finally {
        setLoadingAction(false);
      }
    }
    dispatch({ type: 'CANCEL_RIDE' });
  }

  return (
    <>
      <Card className="border-2 border-brand/50 shadow-lg shadow-brand/10 p-4 sm:p-5">
        {/* Cabeçalho */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-brand-700 dark:text-brand">
              {ride.status === 'accepted' && '🚗 A caminho do passageiro'}
              {ride.status === 'arrived' && '📍 No local de embarque'}
              {ride.status === 'in-progress' && '🏁 Em viagem até o destino'}
              {ride.status === 'completed' && '✅ Corrida finalizada'}
            </span>
          </div>
          <Badge className="border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-bold">
            {ride.passengerName}
          </Badge>
        </div>

        {/* Valor + progress bar */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {formatBRL(ride.fare)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {ride.distanceKm.toLocaleString('pt-BR')} km · {ride.estimatedMinutes} min
            </div>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-2 w-7 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-brand' : 'bg-slate-200 dark:bg-dark-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Rota */}
        <div className="space-y-2.5 rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/60 p-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Embarque</div>
              <span className="font-semibold text-slate-900 dark:text-white">{ride.pickup}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Destino</div>
              <span className="font-semibold text-slate-900 dark:text-white">{ride.dropoff}</span>
            </div>
          </div>
        </div>

        {/* Botão de navegação — abre seletor com Waze e Google Maps */}
        <button
          onClick={() => setNavModalOpen(true)}
          className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-black text-slate-950 shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95"
        >
          <Navigation size={16} />
          {navLabel}
          <span className="rounded-xl bg-black/15 px-2 py-0.5 text-[11px] font-black">
            {navAppLabel}
          </span>
          <ExternalLink size={13} className="opacity-80" />
        </button>

        {/* Ações da Corrida */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {ride.status === 'accepted' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction}>
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button variant="success" onClick={handleArrived} disabled={loadingAction} className="bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 font-black">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Cheguei ao Local
              </Button>
            </>
          )}

          {ride.status === 'arrived' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction}>
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button variant="success" onClick={handleStart} disabled={loadingAction} className="bg-emerald-500 hover:bg-emerald-600 font-black">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Iniciar Viagem
              </Button>
            </>
          )}

          {ride.status === 'in-progress' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction}>
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button variant="success" onClick={() => setCheckoutModalOpen(true)} disabled={loadingAction} className="bg-emerald-600 hover:bg-emerald-700 font-black">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} Finalizar Corrida
              </Button>
            </>
          )}

          {ride.status === 'completed' && (
            <div className="col-span-2 flex items-center justify-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} /> Corrida finalizada
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Navegação (Waze / Google Maps) */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setNavModalOpen(false)}
        address={navAddress}
        coords={navCoords}
        destinationLabel={isGoingToDropoff ? 'Destino' : 'Embarque'}
      />

      {/* Modal de Checkout / PIX QR Code e Avaliação */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        rideId={ride.id}
        fareAmount={ride.fare}
        passengerName={ride.passengerName}
        pickupAddress={ride.pickup}
        dropoffAddress={ride.dropoff}
        onFinishRide={handleFinishCheckout}
      />
    </>
  );
}
