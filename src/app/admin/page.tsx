"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { Card, SectionTitle } from "@/components/ui";
import { Users, Clock, DollarSign, Activity, Check, X, Shield, ExternalLink, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

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
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('mode=reset')) {
        window.location.href = '/login' + search + hash;
        return;
      }
    }
    loadDrivers();
  }, []);

  const updateDriverStatus = async (
    id: string,
    status: "Aprovado" | "Reprovado"
  ) => {
    let payload: Record<string, any> = { status, vehicle_status: status };
    let { error: updateError } = await supabase
      .from("motoristas")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      const match = updateError.message.match(/Could not find the '([^']+)' column/i);
      if (match && match[1] && payload[match[1]] !== undefined) {
        delete payload[match[1]];
        const retry = await supabase.from("motoristas").update(payload).eq("id", id);
        updateError = retry.error;
      }
    }

    if (updateError) {
      setError(
        "Não foi possível atualizar este motorista: " + updateError.message
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
    <div className="flex flex-col space-y-6 p-4 text-slate-900 dark:text-slate-100 min-h-screen bg-[color:var(--bg)] pb-28 transition-colors select-none font-sans">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/perfil"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:text-white transition"
              title="Voltar ao Perfil"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield size={20} className="text-brand-600 dark:text-brand" />
                <span>Painel Gerencial</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Controle operacional e aprovações</p>
            </div>
          </div>
          <a
            href="https://srlogisticatrasporte.vercel.app/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-brand text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs hover:brightness-105 active:scale-[0.98] transition shadow-md shadow-brand/20 shrink-0"
          >
            <span>Central Web</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Banner com link direto para o painel oficial da Central */}
        <div className="rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/15 via-brand/10 to-transparent p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
              <span>Portal de Gestão SR Logística</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
              Abra a plataforma web completa para relatórios e despacho avançado
            </p>
          </div>
          <a
            href="https://srlogisticatrasporte.vercel.app/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs hover:brightness-105 shrink-0 flex items-center gap-1"
          >
            <span>Acessar</span>
            <ExternalLink size={12} />
          </a>
        </div>
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
            <span className="text-[11px] font-bold uppercase tracking-wider">Cadastrados</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{drivers.length}</div>
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

      <div className="pb-6">
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

      <BottomNav />
    </div>
  );
}
