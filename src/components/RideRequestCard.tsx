'use client';

import { AlertTriangle, Check, Clock, MapPin, Route, Star, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { RideRequest } from '@/lib/types';
import { calcPerHour, calcPerKm, formatBRL, isProfitable, profitabilityMeta, ratingColor } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';

export function RentabilityPanel({ fare, distanceKm, minutes }: { fare: number; distanceKm: number; minutes: number }) {
  const perKm = calcPerKm(fare, distanceKm);
  const perHour = calcPerHour(fare, minutes);
  const verdict = isProfitable(perKm, perHour);
  const meta = profitabilityMeta(verdict);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/60 p-3 shadow-inner">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rentabilidade</span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        >
          {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">R$ por km</div>
          <div className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{formatBRL(perKm)}</div>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 py-2">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">R$ por hora</div>
          <div className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{formatBRL(perHour)}</div>
        </div>
      </div>
    </div>
  );
}

export default function RideRequestCard({ ride }: { ride: RideRequest }) {
  const { dispatch } = useApp();
  const passengerRating = typeof ride.passengerRating === 'number' ? ride.passengerRating : 0;
  const flagged =
    passengerRating < 4.5 ||
    (ride.passengerAccountMonths ?? 0) < 3 ||
    (ride.paymentMethod === 'cash' && false);

  return (
    <Card className="animate-[pulse-in_.3s_ease-out] border-2 border-brand shadow-xl shadow-brand/15 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-brand" />
          <span className="text-sm font-black text-slate-900 dark:text-white">Nova Corrida Disponível</span>
        </div>
        <Badge className="border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-bold">
          <Clock size={11} />
          {ride.estimatedMinutes} min
        </Badge>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{formatBRL(ride.fare)}</div>
          <div className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400 font-medium">
            Pagamento via <span className="font-bold text-slate-800 dark:text-slate-200">{ride.paymentMethod}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-bold">
            <Route size={11} />
            {ride.distanceKm.toLocaleString('pt-BR')} km
          </Badge>
        </div>
      </div>

      <div className="mb-3 space-y-2 rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/70 p-3">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ride.pickup}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ride.dropoff}</span>
        </div>
      </div>

      <RentabilityPanel fare={ride.fare} distanceKm={ride.distanceKm} minutes={ride.estimatedMinutes} />

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/70 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/20 text-sm font-black text-brand-800 dark:text-brand">
            {(ride.passengerName && ride.passengerName.charAt) ? ride.passengerName.charAt(0) : ''}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{ride.passengerName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Conta de {ride.passengerAccountMonths} mes(es) · {ride.passengerTrips} viagens
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm font-bold ${ratingColor(passengerRating)}`}>
            <Star size={13} fill="currentColor" />
            {typeof ride.passengerRating === 'number' ? passengerRating.toFixed(1) : '--'}
          </div>
          {flagged && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              <AlertTriangle size={11} /> Perfil novo
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="danger" size="lg" onClick={() => dispatch({ type: 'REJECT_RIDE' })}>
          <X size={16} /> Recusar
        </Button>
        <Button variant="success" size="lg" onClick={() => dispatch({ type: 'ACCEPT_RIDE' })}>
          <Check size={16} /> Aceitar
        </Button>
      </div>
    </Card>
  );
}

