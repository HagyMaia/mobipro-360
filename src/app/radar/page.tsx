'use client';

import dynamic from 'next/dynamic';
import { CalendarClock, MapPin, Radio } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Card, SectionTitle } from '@/components/ui';
import { HEAT_ZONES } from '@/lib/mock-data';

// Importação dinâmica com ssr: false para evitar o erro 'L is not defined'
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full animate-pulse items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-sm text-slate-500">
      Carregando mapa de demanda...
    </div>
  ),
});

const EVENT_NEWS = [
  { label: 'Eventos no Centro (23h)', zone: 'Teatro Amazonas', time: 'Hoje' },
  { label: 'Chegada de voos (23h–1h)', zone: 'Aeroporto Eduardo Gomes', time: 'Hoje' },
  { label: 'Movimento noturno na orla', zone: 'Ponta Negra', time: 'Hoje' },
  { label: 'Fim do expediente industrial', zone: 'Distrito Industrial', time: '18h–20h' },
];

export default function RadarPage() {
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[color:var(--bg)] text-slate-900 dark:text-slate-50 transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Radar de <span className="text-brand-600 dark:text-brand">Demanda</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Onde se posicionar para obter corridas mais rentáveis
            </p>
          </div>
          {/* Badge "Ao Vivo" */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <Radio size={11} className="animate-pulse" />
            Ao vivo · {now}
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 pb-28 flex-1">
        {/* Mapa heatmap */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-dark-700/80 shadow-md">
          <HeatmapMap zones={HEAT_ZONES} />
        </div>

        {/* Legenda de intensidade */}
        <Card className="flex items-center justify-between py-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Intensidade:</span>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              Baixa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Alta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Altíssima
            </span>
          </div>
        </Card>

        {/* Alertas de eventos */}
        <div>
          <SectionTitle className="mb-2.5 flex items-center gap-1.5">
            <CalendarClock size={14} className="text-brand-600 dark:text-brand" />
            Alertas de Eventos e Picos
          </SectionTitle>
          <div className="space-y-2.5">
            {EVENT_NEWS.map((ev) => (
              <Card
                key={ev.label}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{ev.label}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin size={11} className="text-slate-400" />
                    {ev.zone}
                  </div>
                </div>
                <Badge className="shrink-0 bg-brand/15 text-brand-800 dark:text-brand-300 border-brand/30 font-bold">{ev.time}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}