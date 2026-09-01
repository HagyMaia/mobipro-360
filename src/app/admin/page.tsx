"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { Card, SectionTitle } from "@/components/ui";
import { Users, Clock, DollarSign, Activity, Check, X } from "lucide-react";

type Driver = {
  id: string;
  nome: string;
  email?: string;
  status: string;
  telefone?: string;
  categoria?: string;
};

export default function AdminPage() {
  const { state, todayEarnings, todayRides } = useApp();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    const { data, error: driversError } = await supabase
      .from("motoristas")
      .select("id, nome, status, telefone, categoria")
      .order("created_at", { ascending: false });

    if (driversError) {
      setError(
        "Não foi possível carregar os motoristas. Verifique a tabela e as políticas RLS."
      );
    } else {
      setDrivers(data || []);
      setError("");
    }
    setLoadingDrivers(false);
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const updateDriverStatus = async (
    id: string,
    status: "Aprovado" | "Reprovado"
  ) => {
    const { error: updateError } = await supabase
      .from("motoristas")
      .update({ status })
      .eq("id", id);
    if (updateError) {
      setError(
        "Não foi possível atualizar este motorista. Verifique se sua conta é administradora."
      );
      return;
    }
    setDrivers((current) =>
      current.map((driver) => (driver.id === id ? { ...driver, status } : driver))
    );
  };

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
    <div className="flex flex-col space-y-6 p-4 text-slate-200">
      <header className="mb-2">
        <h1 className="text-2xl font-extrabold text-slate-100">Painel Gerencial</h1>
        <p className="text-sm text-slate-300">Acompanhamento em tempo real</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 border border-white/6 bg-[color:var(--surface)]/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <DollarSign size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento (Hoje)</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">R$ {Number(todayEarnings ?? 0).toFixed(2)}</div>
        </Card>

        <Card className="flex flex-col gap-1 border border-white/6 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Activity size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Corridas (Hoje)</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{todayRides}</div>
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

      <div>
        <SectionTitle className="mb-3 text-slate-400">Últimas Corridas</SectionTitle>
        <Card className="overflow-hidden border border-gray-200 p-0 shadow-sm">
          {state.rideHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nenhuma corrida registrada hoje.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.rideHistory.slice(0, 5).map((ride) => {
                let timeStr = "--";
                if (ride.startedAt && ride.completedAt) {
                  const s = new Date(ride.startedAt).getTime();
                  const c = new Date(ride.completedAt).getTime();
                  timeStr = `${Math.round((c - s) / 60000)} min`;
                }
                return (
                  <div key={ride.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-gray-900">R$ {Number(ride.fare ?? 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{ride.passengerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-brand-700">{ride.status.toUpperCase()}</div>
                      <div className="text-[10px] text-gray-400">Tempo: {timeStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="pb-10">
        <SectionTitle className="mb-3 text-gray-600">Aprovações de Motoristas</SectionTitle>
        <Card className="border border-gray-200 p-0 shadow-sm">
          {error && <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loadingDrivers ? (
            <div className="p-6 text-center text-sm text-gray-500">Carregando motoristas...</div>
          ) : drivers.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nenhum motorista cadastrado.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{driver.nome}</div>
                    <div className="text-xs text-gray-500">{driver.categoria || 'Categoria não informada'} {driver.telefone ? `• ${driver.telefone}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${driver.status === 'Aprovado' ? 'bg-green-100 text-green-700' : driver.status === 'Reprovado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {driver.status}
                    </span>
                    {driver.status === 'Pendente' && (
                      <>
                        <button type="button" aria-label={`Aprovar ${driver.nome}`} onClick={() => updateDriverStatus(driver.id, 'Aprovado')} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
                          <Check size={16} />
                        </button>
                        <button type="button" aria-label={`Reprovar ${driver.nome}`} onClick={() => updateDriverStatus(driver.id, 'Reprovado')} className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
