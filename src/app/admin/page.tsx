'use client';

import { useApp } from '@/lib/store';
import { Card, SectionTitle } from '@/components/ui';
import { Users, Clock, DollarSign, Activity } from 'lucide-react';

const MOCK_DRIVERS = [
  { id: 1, name: 'João Silva', status: 'Ativo', rides: 142, rating: 4.9 },
  { id: 2, name: 'Maria Souza', status: 'Em corrida', rides: 89, rating: 5.0 },
  { id: 3, name: 'Carlos Alves', status: 'Offline', rides: 320, rating: 4.7 }
];

export default function AdminPage() {
  const { state, todayEarnings, todayRides } = useApp();

  const totalTime = state.rideHistory.reduce((acc, ride) => {
    if (ride.startedAt && ride.completedAt) {
      const start = new Date(ride.startedAt).getTime();
      const end = new Date(ride.completedAt).getTime();
      return acc + (end - start);
    }
    return acc;
  }, 0);

  const totalMinutes = Math.round(totalTime / 60000);

  return (
    <div className="flex flex-col space-y-6 p-4">
      <header className="mb-2">
        <h1 className="text-2xl font-extrabold text-gray-900">Painel Gerencial</h1>
        <p className="text-sm text-gray-500">Acompanhamento em tempo real</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 border border-brand-100 bg-brand-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-600">
            <DollarSign size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento (Hoje)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">R$ {todayEarnings.toFixed(2)}</div>
        </Card>

        <Card className="flex flex-col gap-1 border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Activity size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Corridas (Hoje)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayRides}</div>
        </Card>

        <Card className="flex flex-col gap-1 border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Tempo Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalMinutes} min</div>
        </Card>

        <Card className="flex flex-col gap-1 border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Users size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Motoristas Ativos</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">2</div>
        </Card>
      </div>

      {/* Ride History */}
      <div>
        <SectionTitle className="mb-3 text-gray-600">Últimas Corridas</SectionTitle>
        <Card className="overflow-hidden border border-gray-200 p-0 shadow-sm">
          {state.rideHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nenhuma corrida registrada hoje.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.rideHistory.slice(0, 5).map((ride) => {
                let timeStr = '--';
                if (ride.startedAt && ride.completedAt) {
                  const s = new Date(ride.startedAt).getTime();
                  const c = new Date(ride.completedAt).getTime();
                  timeStr = `${Math.round((c - s) / 60000)} min`;
                }
                return (
                  <div key={ride.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-gray-900">R$ {ride.fare.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{ride.passengerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-brand-600">{ride.status.toUpperCase()}</div>
                      <div className="text-[10px] text-gray-400">Tempo: {timeStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Driver Profiles */}
      <div className="pb-10">
        <SectionTitle className="mb-3 text-gray-600">Perfis de Motoristas (Simulação)</SectionTitle>
        <Card className="border border-gray-200 p-0 shadow-sm">
          <div className="divide-y divide-gray-100">
            {MOCK_DRIVERS.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-brand-600">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{d.name}</div>
                    <div className="text-xs text-gray-500">Corridas: {d.rides} • ★ {d.rating}</div>
                  </div>
                </div>
                <div
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    d.status === 'Ativo'
                      ? 'bg-green-100 text-green-700'
                      : d.status === 'Em corrida'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {d.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
