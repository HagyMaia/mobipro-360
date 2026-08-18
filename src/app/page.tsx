'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, MapPin, Navigation } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RentabilityOverlay from '@/components/RentabilityOverlay';
import RideRequestCard from '@/components/RideRequestCard';
import ActiveRideCard from '@/components/ActiveRideCard';
import StatusControl, { StatusPill } from '@/components/StatusControl';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { useApp, useSimulateRide } from '@/lib/store';
import { buildMockRequest } from '@/lib/mock-data';
import { isToday, todayKey } from '@/lib/utils';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const simulate = useSimulateRide();
  const [tick, setTick] = useState(0);
  const counter = useRef(0);

  const triggerRequest = useCallback(() => {
    counter.current += 1;
    simulate(() => buildMockRequest(counter.current));
  }, [simulate]);

  useEffect(() => {
    if (
      state.status === 'available' &&
      !state.incomingRide &&
      !state.activeRide &&
      tick < 40
    ) {
      const delay = 6000 + Math.random() * 9000;
      const timer = setTimeout(triggerRequest, delay);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.incomingRide, state.activeRide, tick, triggerRequest]);

  useEffect(() => {
    if (state.incomingRide && state.filters.autoReject) {
      const f = state.filters;
      const shouldReject =
        state.incomingRide.passengerRating < f.minRating ||
        state.incomingRide.passengerAccountMonths < f.minAccountMonths ||
        (f.rejectCash && state.incomingRide.paymentMethod === 'cash');
      if (shouldReject) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REJECT_RIDE' });
          setTick((t) => t + 1);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.incomingRide, state.filters, dispatch]);

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-50">
              MobiPro <span className="text-brand-400">360</span>
            </h1>
            <p className="text-[11px] capitalize text-slate-400">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill />
            <button className="relative rounded-full bg-dark-700 p-2 text-slate-300 transition hover:text-white">
              <Bell size={16} />
              {state.status === 'available' && state.incomingRide && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-brand-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <StatusControl />

        {state.incomingRide ? (
          <RideRequestCard ride={state.incomingRide} />
        ) : state.activeRide ? (
          <ActiveRideCard />
        ) : state.status === 'available' ? (
          <Card className="flex flex-col items-center gap-3 border-brand-500/30 py-8 text-center">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20">
                <Navigation size={26} className="text-brand-400" />
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-100">Procurando corridas...</div>
              <div className="text-xs text-slate-400">
                Fique atento às novas chamadas e ao filtro de rentabilidade.
              </div>
            </div>
          </Card>
        ) : (
          <Card className="py-8 text-center text-slate-400">
            <EmptyState
              icon={<MapPin size={28} />}
              title={
                state.status === 'break' ? 'Você está em pausa' : 'Você está offline'
              }
              description="Ative o modo Disponível para receber corridas."
            />
          </Card>
        )}

        <div>
          <SectionTitle className="mb-2">Resumo do dia</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[11px] uppercase text-slate-500">Rendimento</div>
                <div className="text-lg font-bold tabular-nums text-slate-50">
                  {`R$ ${state.earnings
                    .filter((e) => isToday(e.date))
                    .reduce((s, e) => s + e.amount, 0)
                    .toFixed(0)}`}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Corridas</div>
                <div className="text-lg font-bold tabular-nums text-slate-50">
                  {state.rideHistory.filter(
                    (r) => r.completedAt && isToday(r.completedAt)
                  ).length}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Meta</div>
                <div className="text-lg font-bold tabular-nums text-slate-50">
                  {Math.round(
                    (state.earnings
                      .filter((e) => isToday(e.date))
                      .reduce((s, e) => s + e.amount, 0) /
                      state.goalTarget) *
                      100
                  )}
                  %
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <RentabilityOverlay />
      <BottomNav />
    </>
  );
}
