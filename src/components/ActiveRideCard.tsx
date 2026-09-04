'use client';

import { CheckCircle2, ExternalLink, Flag, MapPin, Navigation, Phone, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { openNavigation } from '@/lib/navigation';
import { formatBRL } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';

const STEPS = [
  { key: 'accepted', label: 'A caminho' },
  { key: 'in-progress', label: 'Em corrida' },
  { key: 'completed', label: 'Finalizada' }
] as const;

export default function ActiveRideCard() {
  const { state, dispatch } = useApp();
  const ride = state.activeRide;
  if (!ride) return null;

  const stepIndex = STEPS.findIndex((s) => s.key === ride.status);
  const navApp = state.navApp ?? 'waze';

  // Endereço alvo de navegação:
  // - "accepted" (a caminho) → navegar até o PICKUP (embarque)
  // - "in-progress" (em corrida) → navegar até o DROPOFF (destino)
  const navAddress = ride.status === 'in-progress' ? ride.dropoff : ride.pickup;
  const navLabel = ride.status === 'in-progress' ? 'Navegar ao destino' : 'Navegar ao embarque';
  const navAppLabel = navApp === 'waze' ? 'Waze' : 'Google Maps';

  function handleNavigate() {
    openNavigation(navAddress, navApp);
  }

  return (
    <Card className="border-2 border-brand/50 shadow-lg shadow-brand/10 p-4 sm:p-5">
      {/* Cabeçalho */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-black text-brand-700 dark:text-brand">Corrida em andamento</span>
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

      {/* Botão de navegação — destaque visual */}
      <button
        onClick={handleNavigate}
        className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-black text-slate-950 shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95"
      >
        <Navigation size={16} />
        {navLabel}
        <span className="rounded-xl bg-black/15 px-2 py-0.5 text-[11px] font-black">
          {navAppLabel}
        </span>
        <ExternalLink size={13} className="opacity-80" />
      </button>

      {/* Ações */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {ride.status === 'accepted' && (
          <>
            <Button variant="outline" onClick={() => dispatch({ type: 'CANCEL_RIDE' })}>
              <XCircle size={16} /> Cancelar
            </Button>
            <Button variant="success" onClick={() => dispatch({ type: 'START_RIDE' })}>
              <Phone size={16} /> Iniciar corrida
            </Button>
          </>
        )}
        {ride.status === 'in-progress' && (
          <>
            <Button variant="outline" onClick={() => dispatch({ type: 'CANCEL_RIDE' })}>
              <XCircle size={16} /> Cancelar
            </Button>
            <Button variant="success" onClick={() => dispatch({ type: 'COMPLETE_RIDE' })}>
              <Flag size={16} /> Finalizar corrida
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
  );
}

