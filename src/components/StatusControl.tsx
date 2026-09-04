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
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10 font-black'
            : status === 'break'
              ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10 font-black'
              : 'border-slate-300 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 shadow-sm font-black';

        return (
          <button
            key={status}
            disabled={disabled || !canChange}
            onClick={() => dispatch({ type: 'SET_STATUS', status })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-bold transition-all duration-200 active:scale-95',
              active
                ? stateStyles
                : 'border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-500 dark:text-slate-400 hover:border-brand/40 hover:text-slate-900 dark:hover:text-white',
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
    offline: { label: 'Offline', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    available: { label: 'Disponível', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600 dark:text-emerald-400' },
    'en-route': { label: 'A caminho', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    'on-ride': { label: 'Em corrida', dot: 'bg-brand', text: 'text-brand-700 dark:text-brand' },
    break: { label: 'Em pausa', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' }
  };
  const info = map[state.status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold', info.text)}>
      <Wifi size={13} />
      <span className={cn('h-2 w-2 rounded-full', info.dot)} />
      {info.label}
    </span>
  );
}

