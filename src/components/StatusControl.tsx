'use client';

import { Coffee, Moon, Play, Wifi } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { WorkStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ status: WorkStatus; label: string; icon: typeof Play }> = [
  { status: 'available', label: 'Disponível', icon: Play },
  { status: 'break', label: 'Pausa', icon: Coffee },
  { status: 'offline', label: 'Offline', icon: Moon }
];

export default function StatusControl({ disabled }: { disabled?: boolean }) {
  const { state, dispatch } = useApp();
  const canChange = state.activeRide === null && state.incomingRide === null;

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {OPTIONS.map(({ status, label, icon: Icon }) => {
        const active = state.status === status;

        const stateStyles =
          status === 'available'
            ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
            : status === 'break'
              ? 'border-amber-500/40 bg-amber-500/12 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.1)]'
              : 'border-slate-600 bg-slate-700/80 text-slate-200 shadow-[0_0_0_1px_rgba(148,163,184,0.1)]';

        return (
          <button
            key={status}
            disabled={disabled || !canChange}
            onClick={() => dispatch({ type: 'SET_STATUS', status })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-all duration-200',
              active ? stateStyles : 'border-dark-700 bg-dark-800/80 text-slate-400 hover:border-dark-600 hover:bg-dark-700/80',
              (!canChange || disabled) && 'pointer-events-none opacity-50'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StatusPill() {
  const { state } = useApp();
  const map: Record<WorkStatus, { label: string; dot: string; text: string }> = {
    offline: { label: 'Offline', dot: 'bg-red-400', text: 'text-red-300' },
    available: { label: 'Disponível', dot: 'bg-emerald-400', text: 'text-emerald-300' },
    'en-route': { label: 'A caminho do passageiro', dot: 'bg-amber-400', text: 'text-amber-300' },
    'on-ride': { label: 'Em corrida', dot: 'bg-brand-400', text: 'text-brand-300' },
    break: { label: 'Em pausa', dot: 'bg-slate-400', text: 'text-slate-300' }
  };
  const info = map[state.status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', info.text)}>
      <Wifi size={13} />
      <span className={cn('h-2 w-2 rounded-full', info.dot)} />
      {info.label}
    </span>
  );
}
