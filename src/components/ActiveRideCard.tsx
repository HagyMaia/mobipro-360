import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Flag, Loader2, MapPin, Navigation, Phone, Play, XCircle, MessageSquare, Map as MapIcon } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { RideService } from '@/services/ride/RideService';
import { ChatService } from '@/services/chat/ChatService';
import { formatBRL } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';
import { NavigationModal } from '@/components/NavigationModal';
import { PaymentCheckoutModal } from '@/components/Ride/PaymentCheckoutModal';
import { ChatModal } from '@/components/Ride/ChatModal';

const STEPS = [
  { key: 'accepted', label: 'A caminho' },
  { key: 'arrived', label: 'No local' },
  { key: 'in-progress', label: 'Em viagem' },
  { key: 'completed', label: 'Finalizada' }
] as const;

export default function ActiveRideCard() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [loadingAction, setLoadingAction] = useState(false);
  const [isNavModalOpen, setNavModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const ride = state.activeRide;

  // Escuta novas mensagens do chat para mostrar o badge de não lidas
  useEffect(() => {
    if (!ride?.id) return;
    const unsubscribe = ChatService.subscribeToRideMessages(ride.id, (msg) => {
      if (msg.sender_role === 'passenger' && !isChatModalOpen) {
        setUnreadMessages((prev) => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [ride?.id, isChatModalOpen]);

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

  // Redireciona o motorista diretamente para a tela do mapa com o trajeto traçado
  const handleGoToMap = () => {
    router.push('/mapa');
  };

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
        await RideService.cancelRide(ride.id, user?.id, 'Cancelado pelo motorista', 'driver');
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
      <Card className="border-2 border-brand/60 shadow-xl shadow-brand/10 p-4 sm:p-5">
        {/* Cabeçalho com Status e Ações Rápidas de Contato */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={handleGoToMap}
            className="flex items-center gap-2 group text-left transition hover:opacity-90"
            title="Clique para abrir o mapa com o trajeto"
          >
            <span className="inline-flex h-3 w-3 rounded-full bg-brand animate-ping" />
            <span className="text-sm font-black text-brand-700 dark:text-brand group-hover:underline flex items-center gap-1.5">
              {ride.status === 'accepted' && '🚗 A caminho do passageiro'}
              {ride.status === 'arrived' && '📍 No local de embarque'}
              {ride.status === 'in-progress' && '🏁 Em viagem até o destino'}
              {ride.status === 'completed' && '✅ Corrida finalizada'}
            </span>
          </button>

          {/* Botões rápidos: Chat com passageiro + Ver no Mapa */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUnreadMessages(0);
                setChatModalOpen(true);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-slate-800 dark:text-brand hover:bg-brand/25 transition active:scale-95 shadow-sm"
              aria-label="Abrir chat com o passageiro"
              title="Chat com o passageiro"
            >
              <MessageSquare size={17} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-dark-900 animate-bounce">
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={handleGoToMap}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-dark-700 transition active:scale-95"
              title="Ver trajeto no mapa"
            >
              <MapIcon size={17} />
            </button>
          </div>
        </div>

        {/* Informações do Passageiro */}
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-dark-900/70 p-3 border border-slate-200/80 dark:border-dark-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand font-black text-slate-950 text-sm shadow-sm">
              {ride.passengerName?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {ride.passengerName}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                ⭐ {ride.passengerRating ? Number(ride.passengerRating).toFixed(1) : '5.0'} · {ride.passengerTrips ?? 12} viagens
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
              {formatBRL(ride.fare)}
            </div>
            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
              {ride.paymentMethod || 'PIX'}
            </div>
          </div>
        </div>

        {/* Progresso da corrida em passos */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {ride.distanceKm.toLocaleString('pt-BR')} km · {ride.estimatedMinutes} min
          </span>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-2 w-7 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-brand' : 'bg-slate-200 dark:bg-dark-700'
                }`}
                title={s.label}
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

        {/* Botão A Caminho / Ver no Mapa Traçado */}
        {ride.status === 'accepted' && (
          <button
            onClick={handleGoToMap}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black text-slate-950 shadow-md shadow-brand/25 transition hover:brightness-105 active:scale-95"
          >
            <MapIcon size={18} />
            A Caminho (Ver Trajeto no Mapa)
          </button>
        )}

        {/* Botão de navegação externa (Waze / Google Maps) */}
        <button
          onClick={() => setNavModalOpen(true)}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-dark-700 active:scale-95"
        >
          <Navigation size={16} className="text-brand-600 dark:text-brand" />
          {navLabel}
          <span className="rounded-xl bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[11px] font-black">
            {navAppLabel}
          </span>
          <ExternalLink size={13} className="opacity-70" />
        </button>

        {/* Ações da Corrida */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {ride.status === 'accepted' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction} className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleArrived}
                disabled={loadingAction}
                className="bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25"
              >
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Cheguei ao Local
              </Button>
            </>
          )}

          {ride.status === 'arrived' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction} className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleStart}
                disabled={loadingAction}
                className="bg-emerald-500 hover:bg-emerald-600 font-black text-slate-950 shadow-lg shadow-emerald-500/25"
              >
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Iniciar Viagem
              </Button>
            </>
          )}

          {ride.status === 'in-progress' && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={loadingAction} className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Cancelar
              </Button>
              <Button
                variant="success"
                onClick={() => setCheckoutModalOpen(true)}
                disabled={loadingAction}
                className="bg-emerald-600 hover:bg-emerald-700 font-black text-white shadow-lg shadow-emerald-600/25"
              >
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

      {/* Modal de Chat em Tempo Real com o Passageiro */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setChatModalOpen(false)}
        rideId={ride.id}
        passengerName={ride.passengerName}
        driverName={(user as any)?.user_metadata?.name || (user as any)?.user_metadata?.displayName || 'Você'}
        driverId={user?.id}
      />

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
