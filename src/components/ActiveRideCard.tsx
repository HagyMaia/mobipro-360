'use client';

import { CheckCircle2, Flag, MapPin, Phone, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
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

  return (
    <Card className="border-brand-500/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-brand-300">Corrida em andamento</span>
        <Badge className="bg-dark-700 text-slate-300">
          {ride.passengerName}
        </Badge>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold tabular-nums text-slate-50">
            {formatBRL(ride.fare)}
          </div>
          <div className="text-xs text-slate-400">
            {ride.distanceKm.toLocaleString('pt-BR')} km · {ride.estimatedMinutes} min
          </div>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 w-6 rounded-full ${
                i <= stepIndex ? 'bg-brand-500' : 'bg-dark-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl bg-dark-700/40 p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0 text-success" />
          <span className="text-slate-200">{ride.pickup}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0 text-danger" />
          <span className="text-slate-200">{ride.dropoff}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
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
          <div className="col-span-2 flex items-center justify-center gap-2 text-success">
            <CheckCircle2 size={18} /> Corrida finalizada
          </div>
        )}
      </div>
    </Card>
  );
}
