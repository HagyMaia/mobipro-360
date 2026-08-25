'use client';

import dynamic from 'next/dynamic';
import { CalendarClock, Flame, MapPin, Radio, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Card, ProgressBar, SectionTitle } from '@/components/ui';
import { HEAT_ZONES } from '@/lib/mock-data';
import { formatBRLShort } from '@/lib/utils';

// Importação dinâmica com ssr: false para evitar o erro 'L is not defined'
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full animate-pulse items-center justify-center rounded-xl bg-dark-700 text-sm text-slate-500">
      Carregando mapa de demanda...
    </div>
  ),
});

const EVENT_NEWS = [
  { label: 'Show no Tom Brasil (23h)', zone: 'Paulista', time: 'Hoje' },
  { label: 'Chegada de voos (23h–1h)', zone: 'Aeroporto CGH', time: 'Hoje' },
  { label: 'Jogo Palmeiras vs Corinthians', zone: 'Allianz Parque', time: 'Qui 20h' },
  { label: 'Fim do expediente Faria Lima', zone: 'Faria Lima', time: '18h–20h' },
];

function intensityColor(intensity: number): string {
  if (intensity >= 80) return 'bg-gradient-to-r from-warn to-danger';
  if (intensity >= 50) return 'bg-gradient-to-r from-brand-400 to-warn';
  return 'bg-brand-500';
}

function intensityLabel(intensity: number): string {
  if (intensity >= 80) return 'Altíssima';
  if (intensity >= 60) return 'Alta';
  if (intensity >= 40) return 'Média';
  return 'Baixa';
}

function intensityBadgeClass(intensity: number): string {
  if (intensity >= 80) return 'bg-danger/15 text-danger';
  if (intensity >= 60) return 'bg-warn/15 text-warn';
  if (intensity >= 40) return 'bg-brand-500/15 text-brand-300';
  return 'bg-slate-700 text-slate-400';
}

export default function RadarPage() {
  const ranked = [...HEAT_ZONES].sort((a, b) => b.intensity - a.intensity);
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-800/95 px-4 pb-3 pt-4 backdrop-blur-md shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-50">
              Radar de <span className="text-brand-400">demanda</span>
            </h1>
            <p className="text-xs text-slate-400">
              Onde posicionar para corridas mais rentáveis
            </p>
          </div>
          {/* Badge "Ao Vivo" */}
          <div className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
            <Radio size={11} className="animate-pulse" />
            Ao vivo · {now}
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 pb-28">
        {/* Mapa heatmap */}
        <HeatmapMap zones={HEAT_ZONES} />

        {/* Legenda de intensidade */}
        <Card className="flex items-center justify-between py-2.5">
          <span className="text-xs text-slate-400">Intensidade:</span>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
              Baixa
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-warn" />
              Alta
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-danger" />
              Altíssima
            </span>
          </div>
        </Card>

        {/* Ranking de zonas */}
        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-brand-400" />
            Ranking de zonas
          </SectionTitle>
          <Card className="space-y-4">
            {ranked.map((zone, i) => (
              <div key={zone.id} className="flex items-center gap-3">
                <div
                  className={`w-6 shrink-0 text-center text-sm font-bold ${
                    i === 0
                      ? 'text-warn'
                      : i < 3
                        ? 'text-brand-400'
                        : 'text-slate-500'
                  }`}
                >
                  {i + 1}°
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-200">
                      <MapPin size={13} className="shrink-0 text-slate-500" />
                      {zone.name}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge className={intensityBadgeClass(zone.intensity)}>
                        {intensityLabel(zone.intensity)}
                      </Badge>
                      <span className="text-xs tabular-nums text-slate-400">
                        {formatBRLShort(zone.avgFare)} méd.
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={zone.intensity / 100}
                    className="mt-1.5 h-1.5"
                    barClassName={intensityColor(zone.intensity)}
                  />
                  {zone.events && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {zone.events.map((e) => (
                        <Badge key={e} className="bg-warn/15 text-warn">
                          <Flame size={10} />
                          {e}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Alertas de eventos */}
        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <CalendarClock size={14} className="text-brand-400" />
            Alertas de eventos
          </SectionTitle>
          <div className="space-y-2">
            {EVENT_NEWS.map((ev) => (
              <Card
                key={ev.label}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-200">{ev.label}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin size={10} />
                    {ev.zone}
                  </div>
                </div>
                <Badge className="shrink-0 bg-brand-600/20 text-brand-300">{ev.time}</Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}