'use client';

import dynamic from 'next/dynamic';
import { CalendarClock, Flame, MapPin, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Card, ProgressBar, SectionTitle } from '@/components/ui';
import { HEAT_ZONES } from '@/lib/mock-data';
import { formatBRLShort } from '@/lib/utils';

// Importação dinâmica com ssr: false para evitar o erro 'L is not defined'
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">
      Carregando mapa de demanda...
    </div>
  ),
});

const EVENT_NEWS = [
  { label: 'Show no Tom Brasil (23h)', zone: 'Paulista', time: 'Hoje' },
  { label: 'Chegada de voos (23h-1h)', zone: 'Aeroporto CGH', time: 'Hoje' },
  { label: 'Jogo Palmeiras vs Corinthians', zone: 'Allianz Parque', time: 'Qui 20h' },
  { label: 'Fim do expediente Faria Lima', zone: 'Faria Lima', time: '18h-20h' }
];

export default function RadarPage() {
  const ranked = [...HEAT_ZONES].sort((a, b) => b.intensity - a.intensity);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-slate-50">
          Radar de <span className="text-brand-400">demanda</span>
        </h1>
        <p className="text-xs text-slate-400">
          Onde posicionar para corridas mais rentáveis
        </p>
      </header>

      <div className="space-y-4 p-4">
        <HeatmapMap zones={HEAT_ZONES} />

        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-brand-400" />
            Ranking de zonas
          </SectionTitle>
          <Card className="space-y-3">
            {ranked.map((zone, i) => (
              <div key={zone.id} className="flex items-center gap-3">
                <div
                  className={`w-6 shrink-0 text-center text-sm font-bold ${i === 0
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
                    <div className="shrink-0 text-xs tabular-nums text-slate-400">
                      {formatBRLShort(zone.avgFare)} media
                    </div>
                  </div>
                  <ProgressBar
                    value={zone.intensity / 100}
                    className="mt-1.5 h-1.5"
                    barClassName={
                      zone.intensity >= 80 ? 'bg-gradient-to-r from-warn to-danger' : 'bg-brand-500'
                    }
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

        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <CalendarClock size={14} className="text-brand-400" />
            Alertas de eventos
          </SectionTitle>
          <div className="space-y-2">
            {EVENT_NEWS.map((ev) => (
              <Card key={ev.label} className="flex items-center justify-between gap-2 py-3">
                <div className="text-sm text-slate-200">{ev.label}</div>
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