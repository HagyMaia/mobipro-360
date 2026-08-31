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
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ status, label, icon: Icon }) => {
        const active = state.status === status;
        return (
          <button
            key={status}
            disabled={disabled || !canChange}
            onClick={() => dispatch({ type: 'SET_STATUS', status })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all',
              active
                ? status === 'available'
                  ? 'border-green-500 bg-green-500 text-white shadow-md'
                  : status === 'break'
                    ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                    : 'border-gray-500 bg-gray-500 text-white shadow-md'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm dark:border-dark-700 dark:bg-dark-800/60 dark:text-slate-400 dark:hover:bg-dark-700/50',
              (!canChange || disabled) && 'pointer-events-none opacity-50'
            )}
          >
            <Icon size={20} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusPill() {
  const { state } = useApp();
  const map: Record<WorkStatus, { label: string; dot: string; text: string }> = {
    offline: { label: 'Offline', dot: 'bg-danger', text: 'text-danger' },
    available: { label: 'Disponível', dot: 'bg-success', text: 'text-success' },
    'en-route': { label: 'A caminho do passageiro', dot: 'bg-warn', text: 'text-warn' },
    'on-ride': { label: 'Em corrida', dot: 'bg-brand-600', text: 'text-brand-600' },
    break: { label: 'Em pausa', dot: 'bg-slate-500', text: 'text-slate-400' }
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
