'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, LogOut, MapPin, Navigation } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RentabilityOverlay from '@/components/RentabilityOverlay';
import RideRequestCard from '@/components/RideRequestCard';
import ActiveRideCard from '@/components/ActiveRideCard';
import StatusControl, { StatusPill } from '@/components/StatusControl';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp, useSimulateRide } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { buildMockRequest } from '@/lib/mock-data';
import { isToday } from '@/lib/utils';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const { signOut } = useAuth();
  const simulate = useSimulateRide();
  const [tick, setTick] = useState(0);
  const [driverName, setDriverName] = useState('Motorista');
  const counter = useRef(0);

  useEffect(() => {
    async function loadDriverProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: motorista } = await supabase
          .from('motoristas')
          .select('nome')
          .eq('id', user.id)
          .maybeSingle();

        if (motorista?.nome) {
          setDriverName(motorista.nome.split(' ')[0]);
        } else if (user.email) {
          setDriverName(user.email.split('@')[0]);
        }
      }
    }

    loadDriverProfile();
  }, []);

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
      <header className="sticky top-0 z-30 bg-brand-700 dark:bg-dark-800/95 px-4 pb-3 pt-4 shadow-md dark:border-b dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Olá, {driverName}
            </h1>
            <p className="text-[11px] capitalize text-brand-200 dark:text-slate-400">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <StatusPill />
            <button className="relative rounded-full bg-brand-600 dark:bg-dark-700 p-2 text-white transition hover:bg-brand-800 dark:hover:text-brand-400">
              <Bell size={16} />
              {state.status === 'available' && state.incomingRide && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
              )}
            </button>

            {/* BOTÃO DE LOGOUT */}
            <button
              onClick={signOut}
              title="Sair do aplicativo"
              className="rounded-full bg-red-500/20 text-red-400 p-2 hover:bg-red-600 hover:text-white transition"
            >
              <LogOut size={16} />
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
          <Card className="flex flex-col items-center gap-3 border border-brand-200 dark:border-brand-500/30 py-8 text-center">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-600/20">
                <Navigation size={26} className="text-brand-500" />
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-slate-100">Procurando corridas...</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Fique atento às novas chamadas e ao filtro de rentabilidade.
              </div>
            </div>
          </Card>
        ) : (
          <Card className="py-8 text-center text-gray-500 dark:text-slate-400">
            <EmptyState
              icon={<MapPin size={28} className="text-gray-400" />}
              title={
                state.status === 'break' ? 'Você está em pausa' : 'Você está offline'
              }
              description="Ative o modo Disponível para receber corridas."
            />
          </Card>
        )}

        <div>
          <SectionTitle className="mb-2 text-gray-600 dark:text-slate-400">Resumo do dia</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center justify-center p-3 text-center">
              <div className="text-[11px] uppercase text-gray-500 dark:text-slate-500">Rendimento</div>
              <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-slate-50">
                {`R$ ${state.earnings
                  .filter((e) => isToday(e.date))
                  .reduce((s, e) => s + e.amount, 0)
                  .toFixed(0)}`}
              </div>
            </Card>
            <Card className="flex flex-col items-center justify-center p-3 text-center">
              <div className="text-[11px] uppercase text-gray-500 dark:text-slate-500">Corridas</div>
              <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-slate-50">
                {state.rideHistory.filter(
                  (r) => r.completedAt && isToday(r.completedAt)
                ).length}
              </div>
            </Card>
            <Card className="flex flex-col items-center justify-center p-3 text-center">
              <div className="text-[11px] uppercase text-gray-500 dark:text-slate-500">Meta</div>
              <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-slate-50">
                {Math.round(
                  (state.earnings
                    .filter((e) => isToday(e.date))
                    .reduce((s, e) => s + e.amount, 0) /
                    state.goalTarget) *
                  100
                )}
                %
              </div>
            </Card>
          </div>
        </div>
      </div>

      <RentabilityOverlay />
      <BottomNav />
    </>
  );
}