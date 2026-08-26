'use client';

import { TrendingUp } from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatBRLShort } from '@/lib/utils';

export default function RentabilityOverlay() {
  const { todayEarnings, todayNet, goalProgress, todayRides } = useApp();

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-30 w-max max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-dark-700 bg-dark-800/95 px-4 py-3 shadow-overlay backdrop-blur-md">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <TrendingUp size={12} className="text-brand-600" />
          Hoje · {todayRides} corridas
        </div>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-lg font-extrabold tabular-nums text-slate-50">
              {formatBRLShort(todayEarnings)}
            </span>
            <span className="text-[10px] text-slate-500"> bruto</span>
          </div>
          <div
            className={`text-sm font-bold tabular-nums ${
              todayNet >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {todayNet >= 0 ? '+' : ''}
            {formatBRLShort(todayNet)} liquido
          </div>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-dark-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-success transition-all"
            style={{ width: `${Math.min(100, goalProgress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
