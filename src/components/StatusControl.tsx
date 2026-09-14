'use client';

import { useState } from 'react';
import { Coffee, Loader2, Moon, Play, Power, Radio, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ProfileService } from '@/services/driver/ProfileService';
import type { WorkStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

interface StatusOption {
  status: WorkStatus;
  label: string;
  sublabel: string;
  icon: typeof Play;
  activeClasses: {
    bg: string;
    text: string;
    badge: string;
    shadow: string;
    border: string;
  };
}

const OPTIONS: StatusOption[] = [
  {
    status: 'available',
    label: 'Disponível',
    sublabel: 'Recebendo chamadas',
    icon: Radio,
    activeClasses: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500',
      text: 'text-white dark:text-slate-950',
      badge: 'bg-white/25 text-white dark:bg-slate-950/20 dark:text-slate-950',
      shadow: 'shadow-lg shadow-emerald-500/30',
      border: 'border-emerald-400/50 dark:border-emerald-300/60',
    },
  },
  {
    status: 'break',
    label: 'Pausa',
    sublabel: 'Descanso temporário',
    icon: Coffee,
    activeClasses: {
      bg: 'bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500',
      text: 'text-white dark:text-slate-950',
      badge: 'bg-white/25 text-white dark:bg-slate-950/20 dark:text-slate-950',
      shadow: 'shadow-lg shadow-amber-500/30',
      border: 'border-amber-400/50 dark:border-amber-300/60',
    },
  },
  {
    status: 'offline',
    label: 'Offline',
    sublabel: 'Turno desconectado',
    icon: Power,
    activeClasses: {
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-dark-700 dark:to-dark-800',
      text: 'text-white dark:text-slate-100',
      badge: 'bg-white/15 text-slate-200 dark:bg-white/10 dark:text-slate-300',
      shadow: 'shadow-md shadow-slate-900/30',
      border: 'border-slate-700/60 dark:border-slate-600/60',
    },
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

  const currentOption = OPTIONS.find((o) => o.status === state.status);

  return (
    <div className="w-full space-y-2.5">
      {/* Segmented Controller Container */}
      <div className="relative rounded-3xl border border-slate-200/80 bg-slate-100/90 p-1.5 shadow-sm backdrop-blur-xl transition-all dark:border-dark-700/80 dark:bg-dark-900/90">
        <div className="grid grid-cols-3 gap-1.5">
          {OPTIONS.map(({ status, label, icon: Icon, activeClasses }) => {
            const active = state.status === status;
            const isButtonUpdating = updating && active;

            return (
              <button
                key={status}
                type="button"
                disabled={disabled || !canChange || updating}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3.5 text-center transition-all duration-300 active:scale-[0.97]',
                  active
                    ? cn(
                        'border font-black',
                        activeClasses.bg,
                        activeClasses.text,
                        activeClasses.shadow,
                        activeClasses.border
                      )
                    : 'border border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-dark-800/60 dark:hover:text-white',
                  (!canChange || disabled || updating) && 'pointer-events-none opacity-60'
                )}
              >
                {/* Active subtle glow beacon */}
                {active && status === 'available' && (
                  <span className="absolute right-2 top-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 dark:bg-slate-950" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-slate-950" />
                  </span>
                )}

                <div className="flex items-center justify-center">
                  {isButtonUpdating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon
                      size={20}
                      className={cn(
                        'transition-transform duration-200 group-hover:scale-110',
                        active ? activeClasses.text : 'text-slate-500 dark:text-slate-400'
                      )}
                    />
                  )}
                </div>

                <span className="text-xs font-black tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Status Subtitle Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 px-3.5 py-2 text-[11px] font-medium backdrop-blur-md dark:border-dark-700/60 dark:bg-dark-900/60">
        <div className="flex items-center gap-2">
          {state.status === 'available' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                Radar de chamadas ativo
              </span>
            </>
          ) : state.status === 'break' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-400">
                Pausa ativa · Chamadas pausadas
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Turno offline · Toque em Disponível para receber corridas
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>GPS Pronto</span>
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
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-dark-800 border-slate-200 dark:border-dark-700',
    },
    available: {
      label: 'Disponível',
      dot: 'bg-emerald-500 animate-pulse',
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
    },
    'en-route': {
      label: 'A caminho',
      dot: 'bg-amber-500 animate-ping',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/25',
    },
    'on-ride': {
      label: 'Em corrida',
      dot: 'bg-brand animate-pulse',
      text: 'text-brand-800 dark:text-brand',
      bg: 'bg-brand/10 border-brand/25',
    },
    break: {
      label: 'Pausa',
      dot: 'bg-amber-400',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/25',
    },
  };
  const info = map[state.status];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-all',
        info.bg,
        info.text
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', info.dot)} />
      <span>{info.label}</span>
    </div>
  );
}
