'use client';

import { AlertTriangle, Check, Clock, MapPin, Route, Star, Wallet, X } from 'lucide-react';
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
    <div className="rounded-xl bg-dark-700/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Rentabilidade
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        >
          {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-dark-800 px-3 py-2">
          <div className="text-[10px] uppercase text-slate-500">R$ por km</div>
          <div className="text-lg font-bold tabular-nums text-slate-100">
            {formatBRL(perKm)}
          </div>
        </div>
        <div className="rounded-lg bg-dark-800 px-3 py-2">
          <div className="text-[10px] uppercase text-slate-500">R$ por hora</div>
          <div className="text-lg font-bold tabular-nums text-slate-100">
            {formatBRL(perHour)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RideRequestCard({ ride }: { ride: RideRequest }) {
  const { dispatch } = useApp();
  const flagged =
    ride.passengerRating < 4.5 ||
    ride.passengerAccountMonths < 3 ||
    (ride.paymentMethod === 'cash' && false);

  return (
    <Card className="animate-[pulse-in_.3s_ease-out] border-brand-500/40">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-brand-400" />
          <span className="text-sm font-bold text-brand-300">Nova corrida</span>
        </div>
        <Badge className="bg-dark-700 text-slate-300">
          <Clock size={11} />
          {ride.estimatedMinutes} min
        </Badge>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-3xl font-extrabold tabular-nums text-slate-50">
            {formatBRL(ride.fare)}
          </div>
          <div className="mt-0.5 text-xs capitalize text-slate-400">
            Pagamento via <span className="font-semibold text-slate-200">{ride.paymentMethod}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-dark-700">
            <Route size={11} />
            {ride.distanceKm.toLocaleString('pt-BR')} km
          </Badge>
        </div>
      </div>

      <div className="mb-3 space-y-2 rounded-xl bg-dark-700/40 p-3">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-success" />
          <span className="text-sm text-slate-200">{ride.pickup}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-danger" />
          <span className="text-sm text-slate-200">{ride.dropoff}</span>
        </div>
      </div>

      <RentabilityPanel fare={ride.fare} distanceKm={ride.distanceKm} minutes={ride.estimatedMinutes} />

      <div className="mt-3 flex items-center justify-between rounded-xl bg-dark-700/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/30 text-sm font-bold text-brand-300">
            {ride.passengerName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">{ride.passengerName}</div>
            <div className="text-[11px] text-slate-400">
              Conta de {ride.passengerAccountMonths} mes(es) · {ride.passengerTrips} viagens
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm font-bold ${ratingColor(ride.passengerRating)}`}>
            <Star size={13} fill="currentColor" />
            {ride.passengerRating.toFixed(1)}
          </div>
          {flagged && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-warn">
              <AlertTriangle size={11} /> Perfil novo
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
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
