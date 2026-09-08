"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { Card, SectionTitle } from "@/components/ui";
import { Users, Clock, DollarSign, Activity, Check, X } from "lucide-react";

type Driver = {
  id: string;
  nome: string;
  nome_social?: string;
  nome_completo?: string;
  email?: string;
  status: string;
  vehicle_status?: string;
  telefone?: string;
  marca_veiculo?: string;
  modelo_veiculo?: string;
  placa_veiculo?: string;
  categoria?: string;
};

export default function AdminPage() {
  const { state, todayEarnings, todayRides } = useApp();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    let { data, error: driversError } = await supabase
      .from("motoristas")
      .select("id, nome, nome_social, nome_completo, status, vehicle_status, telefone, email, marca_veiculo, modelo_veiculo, placa_veiculo, categoria")
      .order("created_at", { ascending: false });

    if (driversError) {
      console.warn("[Admin] Falha ao ordenar por created_at, tentando sem ordenação:", driversError.message);
      const retry = await supabase
        .from("motoristas")
        .select("id, nome, nome_social, nome_completo, status, vehicle_status, telefone, email, marca_veiculo, modelo_veiculo, placa_veiculo, categoria");
      data = retry.data;
      driversError = retry.error;
    }

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
      .update({ status, vehicle_status: status })
      .eq("id", id);
    if (updateError) {
      setError(
        "Não foi possível atualizar este motorista. Verifique se sua conta é administradora."
      );
      return;
    }
    setDrivers((current) =>
      current.map((driver) =>
        driver.id === id ? { ...driver, status, vehicle_status: status } : driver
      )
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
    <div className="flex flex-col space-y-6 p-4 text-slate-900 dark:text-slate-100 min-h-screen bg-[color:var(--bg)] transition-colors">
      <header className="mb-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Painel Gerencial</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhamento operacional e administrativo em tempo real</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand">
            <DollarSign size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento (Hoje)</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">R$ {Number(todayEarnings ?? 0).toFixed(2)}</div>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Activity size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Corridas (Hoje)</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{todayRides}</div>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Tempo Total</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalMinutes} min</div>
        </Card>

        <Card className="flex flex-col gap-1 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Users size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Motoristas Ativos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">2</div>
        </Card>
      </div>

      <div>
        <SectionTitle className="mb-3">Últimas Corridas</SectionTitle>
        <Card className="overflow-hidden p-0 shadow-sm">
          {state.rideHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Nenhuma corrida registrada hoje.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-dark-700">
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
                      <div className="font-bold text-slate-900 dark:text-white">R$ {Number(ride.fare ?? 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ride.passengerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-brand-700 dark:text-brand">{ride.status.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-400">Tempo: {timeStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="pb-10">
        <SectionTitle className="mb-3">Aprovações de Motoristas & Veículos</SectionTitle>
        <Card className="p-0 shadow-sm overflow-hidden">
          {error && <div className="border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm font-semibold text-red-600 dark:text-red-400">{error}</div>}
          {loadingDrivers ? (
            <div className="p-6 text-center text-sm text-slate-500">Carregando solicitações...</div>
          ) : drivers.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Nenhum motorista cadastrado.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-dark-700">
              {drivers.map((driver) => {
                const isPendingVehicle = driver.vehicle_status === "Pendente" && driver.status === "Aprovado";
                const isPending = driver.status === "Pendente" || driver.vehicle_status === "Pendente";
                const displayName = driver.nome_social || driver.nome || "Motorista";

                return (
                  <div key={driver.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
                        {isPendingVehicle && (
                          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Troca de Carro
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {driver.marca_veiculo || ''} {driver.modelo_veiculo || ''} {driver.placa_veiculo ? `(${driver.placa_veiculo})` : ''} {driver.telefone ? `• ${driver.telefone}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        !isPending && driver.status === 'Aprovado'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : driver.status === 'Reprovado' || driver.vehicle_status === 'Reprovado'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {isPendingVehicle ? 'Carro em Análise' : driver.status}
                      </span>
                      {isPending && (
                        <>
                          <button type="button" aria-label={`Aprovar ${displayName}`} onClick={() => updateDriverStatus(driver.id, 'Aprovado')} className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition" title="Aprovar">
                            <Check size={16} />
                          </button>
                          <button type="button" aria-label={`Reprovar ${displayName}`} onClick={() => updateDriverStatus(driver.id, 'Reprovado')} className="rounded-xl bg-red-600 p-2 text-white hover:bg-red-700 transition" title="Reprovar">
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
