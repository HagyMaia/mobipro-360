'use client';

import { useState } from 'react';
import { Coffee, Loader2, Power, Radio, ShieldCheck, Sparkles, Zap, Navigation } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ProfileService } from '@/services/driver/ProfileService';
import type { WorkStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

interface StatusItem {
  status: WorkStatus;
  label: string;
  badge: string;
  icon: typeof Radio;
  activeStyles: string;
  glowStyles: string;
}

const STATUS_ITEMS: StatusItem[] = [
  {
    status: 'available',
    label: 'Disponível',
    badge: 'ONLINE',
    icon: Radio,
    activeStyles:
      'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.45)]',
    glowStyles: 'bg-emerald-400/20 text-emerald-400 border-emerald-500/30',
  },
  {
    status: 'break',
    label: 'Pausa',
    badge: 'DESCANSO',
    icon: Coffee,
    activeStyles:
      'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-amber-200 ring-2 ring-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.45)]',
    glowStyles: 'bg-amber-400/20 text-amber-400 border-amber-500/30',
  },
  {
    status: 'offline',
    label: 'Offline',
    badge: 'TURNO OFF',
    icon: Power,
    activeStyles:
      'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-white border-slate-600 ring-2 ring-slate-500/60 shadow-[0_0_20px_rgba(30,41,59,0.5)]',
    glowStyles: 'bg-slate-800/40 text-slate-400 border-slate-700/40',
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
    <div className="w-full space-y-2.5 select-none">
      {/* Container Principal Estilo Cockpit / Segmented Dock */}
      <div className="relative rounded-3xl p-1.5 bg-slate-900/90 dark:bg-dark-950/95 border border-slate-800/90 dark:border-dark-700/90 shadow-2xl backdrop-blur-2xl transition-all">
        <div className="grid grid-cols-3 gap-2">
          {STATUS_ITEMS.map(({ status, label, badge, icon: Icon, activeStyles }) => {
            const active = state.status === status;
            const isButtonUpdating = updating && active;

            return (
              <button
                key={status}
                type="button"
                disabled={disabled || !canChange || updating}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'group relative flex flex-col items-center justify-between py-3 px-2 rounded-2xl transition-all duration-300 ease-out active:scale-95 border min-h-[72px]',
                  active
                    ? cn('font-black scale-[1.02] z-10', activeStyles)
                    : 'bg-slate-800/50 hover:bg-slate-800/80 dark:bg-dark-900/60 dark:hover:bg-dark-800/80 border-slate-750/50 dark:border-dark-800 text-slate-400 hover:text-slate-200',
                  (!canChange || disabled || updating) && 'pointer-events-none opacity-50'
                )}
              >
                {/* Efeito Glow / Beacon no modo Ativo */}
                {active && (
                  <div className="absolute -top-1 right-2 flex h-2.5 w-2.5">
                    {status === 'available' && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950 opacity-75" />
                    )}
                    <span
                      className={cn(
                        'relative inline-flex h-2.5 w-2.5 rounded-full',
                        status === 'available' ? 'bg-slate-950' : status === 'break' ? 'bg-slate-950' : 'bg-emerald-400'
                      )}
                    />
                  </div>
                )}

                {/* Ícone com animação */}
                <div className="flex items-center justify-center my-0.5">
                  {isButtonUpdating ? (
                    <Loader2 size={22} className="animate-spin text-current" />
                  ) : (
                    <Icon
                      size={22}
                      className={cn(
                        'transition-transform duration-200 group-hover:scale-110',
                        active ? 'text-current stroke-[2.5]' : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                  )}
                </div>

                {/* Texto do Status */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs tracking-tight font-black transition-colors',
                      active ? 'text-current' : 'text-slate-300 dark:text-slate-400'
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-extrabold uppercase tracking-widest mt-0.5',
                      active
                        ? status === 'available' || status === 'break'
                          ? 'text-slate-900/75'
                          : 'text-slate-300'
                        : 'text-slate-500 dark:text-slate-600'
                    )}
                  >
                    {badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Telemetria e Conexão em Tempo Real */}
      <div className="flex items-center justify-between rounded-2xl px-3.5 py-2 text-[11px] bg-slate-900/70 dark:bg-dark-900/80 border border-slate-800/80 dark:border-dark-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {state.status === 'available' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-bold text-emerald-400">
                Radar de chamadas ativo · Pronto para receber corridas
              </span>
            </>
          ) : state.status === 'break' ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="font-bold text-amber-300">
                Modo pausa · Chamadas suspensas temporariamente
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="font-medium text-slate-400">
                Turno offline · Toque em <strong className="text-emerald-400 font-bold">Disponível</strong> para iniciar
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <ShieldCheck size={13} className="text-emerald-400" />
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
      text: 'text-slate-300',
      bg: 'bg-slate-800/80 border-slate-700/70',
    },
    available: {
      label: 'Disponível',
      dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      text: 'text-emerald-300 font-black',
      bg: 'bg-emerald-950/60 border-emerald-500/40',
    },
    'en-route': {
      label: 'A caminho',
      dot: 'bg-amber-400 animate-ping',
      text: 'text-amber-300 font-black',
      bg: 'bg-amber-950/60 border-amber-500/40',
    },
    'on-ride': {
      label: 'Em corrida',
      dot: 'bg-brand animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.8)]',
      text: 'text-brand font-black',
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
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md shadow-sm transition-all',
        info.bg,
        info.text
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', info.dot)} />
      <span>{info.label}</span>
    </div>
  );
}
