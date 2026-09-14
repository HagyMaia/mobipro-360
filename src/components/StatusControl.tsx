'use client';

import { useState } from 'react';
import { Coffee, Loader2, Power, Radio, ShieldCheck } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ProfileService } from '@/services/driver/ProfileService';
import type { WorkStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

interface StatusItem {
  status: WorkStatus;
  label: string;
  icon: typeof Radio;
  activeStyles: string;
}

const STATUS_ITEMS: StatusItem[] = [
  {
    status: 'available',
    label: 'Disponível',
    icon: Radio,
    activeStyles:
      'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30 border-emerald-400',
  },
  {
    status: 'break',
    label: 'Pausa',
    icon: Coffee,
    activeStyles:
      'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30 border-amber-300',
  },
  {
    status: 'offline',
    label: 'Offline',
    icon: Power,
    activeStyles:
      'bg-slate-750 text-white font-bold shadow-sm border-slate-600 bg-slate-800',
  },
];

export default function StatusControl({ disabled }: { disabled?: boolean }) {
  const { state, dispatch } = useApp();
  const [updating, setUpdating] = useState(false);
  const canChange = state.activeRide === null;

  const handleStatusChange = async (targetStatus: WorkStatus) => {
    if (!canChange || disabled || updating || state.status === targetStatus) return;

    setUpdating(true);
    try {
      if (targetStatus === 'available') {
        const profile = await ProfileService.getCurrentProfile();
        if (profile?.status !== 'Aprovado') {
          alert('Seu cadastro precisa estar Aprovado para ficar online e receber corridas.');
          setUpdating(false);
          return;
        }
        await ProfileService.toggleWorkStatus('ONLINE');
      } else {
        await ProfileService.toggleWorkStatus('OFFLINE');
      }
      dispatch({ type: 'SET_STATUS', status: targetStatus });
    } catch (err) {
      console.warn('[StatusControl] Erro ao sincronizar status no banco:', err);
      dispatch({ type: 'SET_STATUS', status: targetStatus });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full space-y-1.5 select-none">
      {/* Segmented Controller Compacto e Elegante */}
      <div className="relative rounded-2xl p-1 bg-slate-900/80 dark:bg-dark-950/90 border border-slate-800 dark:border-dark-700/80 shadow-md backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-1">
          {STATUS_ITEMS.map(({ status, label, icon: Icon, activeStyles }) => {
            const active = state.status === status;
            const isButtonUpdating = updating && active;

            return (
              <button
                key={status}
                type="button"
                disabled={disabled || !canChange || updating}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'group relative flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs transition-all duration-200 active:scale-95 border border-transparent min-h-[38px]',
                  active
                    ? cn('border', activeStyles)
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 dark:hover:bg-dark-800/50',
                  (!canChange || disabled || updating) && 'pointer-events-none opacity-50'
                )}
              >
                {/* Indicador pulsante quando online */}
                {active && status === 'available' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-950" />
                  </span>
                )}

                <div className="flex items-center justify-center">
                  {isButtonUpdating ? (
                    <Loader2 size={14} className="animate-spin text-current" />
                  ) : (
                    <Icon
                      size={14}
                      className={cn(
                        'transition-transform duration-150',
                        active ? 'text-current stroke-[2.5]' : 'text-slate-400'
                      )}
                    />
                  )}
                </div>

                <span className={cn('text-xs tracking-tight', active ? 'font-black' : 'font-semibold')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini status indicator em 1 linha compacta */}
      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          {state.status === 'available' ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400 truncate">Radar ativo · Recebendo chamadas</span>
            </>
          ) : state.status === 'break' ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="font-semibold text-amber-400 truncate">Modo pausa ativado</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="text-slate-400 truncate">Offline · Toque em Disponível para iniciar</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 font-medium text-slate-400 shrink-0">
          <ShieldCheck size={11} className="text-emerald-400" />
          <span>GPS OK</span>
        </div>
      </div>
    </div>
  );
}

export function StatusPill() {
  const { state } = useApp();
  const map: Record<WorkStatus, { label: string; dot: string; text: string; bg: string }> = {
    offline: {
      label: 'Offline',
      dot: 'bg-slate-400',
      text: 'text-slate-400',
      bg: 'bg-slate-800/80 border-slate-700/70',
    },
    available: {
      label: 'Disponível',
      dot: 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]',
      text: 'text-emerald-300 font-bold',
      bg: 'bg-emerald-950/60 border-emerald-500/40',
    },
    'en-route': {
      label: 'A caminho',
      dot: 'bg-amber-400 animate-ping',
      text: 'text-amber-300 font-bold',
      bg: 'bg-amber-950/60 border-amber-500/40',
    },
    'on-ride': {
      label: 'Em corrida',
      dot: 'bg-brand animate-pulse shadow-[0_0_6px_rgba(255,200,0,0.8)]',
      text: 'text-brand font-bold',
      bg: 'bg-brand/15 border-brand/40',
    },
    break: {
      label: 'Pausa',
      dot: 'bg-amber-400',
      text: 'text-amber-300 font-bold',
      bg: 'bg-amber-950/60 border-amber-500/40',
    },
  };
  const info = map[state.status];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md transition-all',
        info.bg,
        info.text
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', info.dot)} />
      <span>{info.label}</span>
    </div>
  );
}
