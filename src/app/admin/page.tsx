"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { ProfileService } from "@/services/driver/ProfileService";
import { Card, SectionTitle } from "@/components/ui";
import {
  Users,
  Clock,
  DollarSign,
  Activity,
  Check,
  X,
  Shield,
  ExternalLink,
  ArrowLeft,
  FileText,
  Filter,
  Download,
  Printer,
  Calendar,
  Car,
  TrendingUp,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  XCircle
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

type Driver = {
  id: string;
  nome: string;
  nome_social?: string;
  nome_completo?: string;
  email?: string;
  avatar_url?: string;
  pending_avatar_url?: string;
  foto_status?: string;
  avatar_status?: string;
  status: string;
  vehicle_status?: string;
  telefone?: string;
  marca_veiculo?: string;
  modelo_veiculo?: string;
  placa_veiculo?: string;
  categoria?: string;
  driver_type?: 'EMPRESA' | 'PARTICULAR';
  tipo_motorista?: 'EMPRESA' | 'PARTICULAR';
  perfil_motorista?: 'EMPRESA' | 'PARTICULAR';
  categoria_motorista?: 'EMPRESA' | 'PARTICULAR';
};

type AdminRide = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  fare_amount: number;
  distance_km: number;
  status: string;
  created_at: string;
  driver_id?: string;
  passenger_id?: string;
  passenger_name?: string;
  driver_name?: string;
  payment_method?: string;
};

type PeriodFilter = 'ALL' | 'Q1' | 'Q2' | 'CURRENT_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export default function AdminPage() {
  const { state, todayEarnings, todayRides } = useApp();
  const [activeTab, setActiveTab] = useState<'DRIVERS' | 'REPORTS'>('DRIVERS');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [updatingDriverId, setUpdatingDriverId] = useState<string | null>(null);
  const [updatingPhotoDriverId, setUpdatingPhotoDriverId] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<{
    url: string;
    name: string;
    driverId: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Relatório Geral de Corridas (Todos os Passageiros)
  const [allRides, setAllRides] = useState<AdminRide[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('CURRENT_MONTH');
  const [selectedPassenger, setSelectedPassenger] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    let { data, error: driversError } = await supabase
      .from("motoristas")
      .select("id, nome, nome_social, nome_completo, avatar_url, pending_avatar_url, foto_status, avatar_status, status, vehicle_status, telefone, email, marca_veiculo, modelo_veiculo, placa_veiculo, categoria, tipo_motorista, driver_type, perfil_motorista, categoria_motorista")
      .order("created_at", { ascending: false });

    if (driversError) {
      console.warn("[Admin] Falha ao ordenar por created_at ou colunas extras, tentando básico:", driversError.message);
      const retry = await supabase
        .from("motoristas")
        .select("id, nome, nome_social, nome_completo, avatar_url, status, vehicle_status, telefone, email, marca_veiculo, modelo_veiculo, placa_veiculo, categoria");
      data = retry.data;
      driversError = retry.error;
    }

    if (driversError) {
      setError("Não foi possível carregar os motoristas.");
    } else {
      setDrivers(data || []);
      setError("");
    }
    setLoadingDrivers(false);
  };

  const loadAllRides = async () => {
    setLoadingRides(true);
    try {
      const { data: rawRides } = await supabase
        .from("rides")
        .select("id, pickup_address, dropoff_address, fare_amount, distance_km, status, created_at, driver_id, passenger_id, payment_method")
        .order("created_at", { ascending: false })
        .limit(300);

      if (rawRides && Array.isArray(rawRides)) {
        // Carrega motoristas para mapear nomes
        const driverIds = Array.from(new Set(rawRides.map((r) => r.driver_id).filter(Boolean)));
        const driverMap: Record<string, string> = {};
        if (driverIds.length > 0) {
          const { data: dData } = await supabase
            .from("motoristas")
            .select("id, nome, nome_social, nome_completo")
            .in("id", driverIds);
          if (dData) {
            dData.forEach((d: any) => {
              driverMap[d.id] = d.nome || d.nome_social || d.nome_completo || "Motorista SR";
            });
          }
        }

        const mapped: AdminRide[] = rawRides.map((r) => ({
          id: r.id,
          pickup_address: r.pickup_address || "Manaus",
          dropoff_address: r.dropoff_address || "Manaus",
          fare_amount: Number(r.fare_amount) || 0,
          distance_km: Number(r.distance_km) || 0,
          status: String(r.status || "COMPLETED").toUpperCase(),
          created_at: r.created_at || new Date().toISOString(),
          driver_id: r.driver_id,
          passenger_id: r.passenger_id,
          passenger_name: r.passenger_id ? `Passageiro (${r.passenger_id.slice(0, 6)})` : "Passageiro SR",
          driver_name: r.driver_id ? driverMap[r.driver_id] || "Motorista Parceiro" : "Motorista SR",
          payment_method: r.payment_method || "PIX / Voucher"
        }));
        setAllRides(mapped);
      }
    } catch (e) {
      console.warn("Erro ao carregar relatório geral de corridas:", e);
    } finally {
      setLoadingRides(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    loadAllRides();
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
      setError("Não foi possível atualizar este motorista: " + updateError.message);
      return;
    }

    setSuccessMessage(`Motorista ${status === 'Aprovado' ? 'aprovado' : 'reprovado'} com sucesso!`);
    setTimeout(() => setSuccessMessage(""), 4000);

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === id ? { ...driver, status, vehicle_status: status } : driver
      )
    );
  };

  const updateDriverType = async (
    id: string,
    newType: 'EMPRESA' | 'PARTICULAR'
  ) => {
    setUpdatingDriverId(id);
    setError("");
    try {
      await ProfileService.setDriverTypeByAdmin(id, newType);

      setSuccessMessage(`Categoria do motorista alterada para ${newType === 'EMPRESA' ? 'Motorista Empresa (Voucher 100% Repasse)' : 'Motorista Particular (-20%)'}!`);
      setTimeout(() => setSuccessMessage(""), 4000);

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === id
            ? {
                ...driver,
                driver_type: newType,
                tipo_motorista: newType,
                perfil_motorista: newType,
                categoria_motorista: newType,
              }
            : driver
        )
      );
    } catch (err: any) {
      console.error("[Admin] Erro ao alterar categoria do motorista:", err);
      setError("Erro ao alterar categoria do motorista: " + (err.message || 'Erro desconhecido'));
    } finally {
      setUpdatingDriverId(null);
    }
  };

  const updateDriverPhotoStatus = async (
    id: string,
    newStatus: 'Aprovado' | 'Reprovado'
  ) => {
    setUpdatingPhotoDriverId(id);
    setError("");
    try {
      await ProfileService.updateDriverPhotoStatusByAdmin(id, newStatus);

      setSuccessMessage(
        newStatus === 'Aprovado'
          ? 'Foto do motorista APROVADA com sucesso!'
          : 'Foto do motorista REJEITADA. O motorista será notificado para reenviar.'
      );
      setTimeout(() => setSuccessMessage(""), 4000);

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === id
            ? {
                ...driver,
                foto_status: newStatus,
                avatar_status: newStatus,
              }
            : driver
        )
      );

      if (photoModal && photoModal.driverId === id) {
        setPhotoModal((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error("[Admin] Erro ao atualizar status da foto:", err);
      setError("Erro ao atualizar status da foto: " + (err.message || 'Erro desconhecido'));
    } finally {
      setUpdatingPhotoDriverId(null);
    }
  };

  // Filtragem de Corridas do Relatório
  const filteredRides = useMemo(() => {
    return allRides.filter((ride) => {
      // Filtro por Passageiro
      if (selectedPassenger !== 'ALL' && ride.passenger_id !== selectedPassenger) {
        return false;
      }

      // Filtro por Período
      if (periodFilter === 'ALL') return true;

      const rideDate = new Date(ride.created_at);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      if (periodFilter === 'CURRENT_MONTH') {
        return rideDate.getFullYear() === currentYear && rideDate.getMonth() === currentMonth;
      }

      if (periodFilter === 'LAST_MONTH') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return (
          rideDate.getFullYear() === lastMonthDate.getFullYear() &&
          rideDate.getMonth() === lastMonthDate.getMonth()
        );
      }

      if (periodFilter === 'Q1') {
        return (
          rideDate.getFullYear() === currentYear &&
          rideDate.getMonth() === currentMonth &&
          rideDate.getDate() >= 1 &&
          rideDate.getDate() <= 15
        );
      }

      if (periodFilter === 'Q2') {
        return (
          rideDate.getFullYear() === currentYear &&
          rideDate.getMonth() === currentMonth &&
          rideDate.getDate() >= 16
        );
      }

      if (periodFilter === 'CUSTOM') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(0);
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date(8640000000000000);
        return rideDate >= start && rideDate <= end;
      }

      return true;
    });
  }, [allRides, periodFilter, selectedPassenger, customStartDate, customEndDate]);

  // Totais Consolidados
  const summary = useMemo(() => {
    const completed = filteredRides.filter((r) =>
      ['COMPLETED', 'FINISHED', 'FINALIZADA', 'CONCLUIDA', 'PAID'].includes(r.status)
    );
    const totalFare = completed.reduce((acc, r) => acc + r.fare_amount, 0);
    const totalKm = filteredRides.reduce((acc, r) => acc + (r.distance_km || 0), 0);
    const avgFare = completed.length > 0 ? totalFare / completed.length : 0;

    // Agrupamento por passageiro
    const passMap = new Map<string, { id: string; name: string; ridesCount: number; completedCount: number; totalKm: number; totalFare: number }>();
    filteredRides.forEach((r) => {
      const key = r.passenger_id || r.passenger_name || 'Passageiro SR';
      if (!passMap.has(key)) {
        passMap.set(key, {
          id: key,
          name: r.passenger_name || 'Passageiro',
          ridesCount: 0,
          completedCount: 0,
          totalKm: 0,
          totalFare: 0,
        });
      }
      const item = passMap.get(key)!;
      item.ridesCount += 1;
      item.totalKm += (r.distance_km || 0);
      if (['COMPLETED', 'FINISHED', 'FINALIZADA', 'CONCLUIDA', 'PAID'].includes(r.status)) {
        item.completedCount += 1;
        item.totalFare += r.fare_amount;
      }
    });

    return {
      totalRides: filteredRides.length,
      completedCount: completed.length,
      totalFare,
      totalKm,
      avgFare,
      passengersList: Array.from(passMap.values())
    };
  }, [filteredRides]);

  // Exportar Relatório PDF Geral
  const handleExportPDF = () => {
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    const passSummaryHtml = selectedPassenger === 'ALL' && summary.passengersList.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
          ● Resumo Consolidado de Todos os Passageiros
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="padding: 6px 8px; text-align: left; font-size: 10px;">Passageiro</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 10px;">Viagens Concluídas</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 10px;">Km Percorridos</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 10px;">Subtotal (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${summary.passengersList.map((p) => `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; font-weight: bold;">${p.name}</td>
                <td style="padding: 6px 8px; text-align: center;">${p.completedCount} / ${p.ridesCount}</td>
                <td style="padding: 6px 8px; text-align: center;">${p.totalKm.toFixed(1)} km</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: bold;">R$ ${p.totalFare.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const rowsHtml = filteredRides.map((ride, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 8px 6px; white-space: nowrap;">${new Date(ride.created_at).toLocaleString('pt-BR')}</td>
        <td style="padding: 8px 6px;">${ride.passenger_name || 'Passageiro'}</td>
        <td style="padding: 8px 6px;">${ride.pickup_address}</td>
        <td style="padding: 8px 6px;">${ride.dropoff_address}</td>
        <td style="padding: 8px 6px;">${ride.driver_name}</td>
        <td style="padding: 8px 6px; text-align: center;">${ride.distance_km ? `${ride.distance_km.toFixed(1)} km` : '-'}</td>
        <td style="padding: 8px 6px; text-align: center; font-weight: bold;">${ride.status}</td>
        <td style="padding: 8px 6px; text-align: right; font-weight: bold;">R$ ${ride.fare_amount.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Geral de Faturamento - SR Logística</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 15px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 18px; font-weight: 900; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; text-align: center; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; text-align: left; padding: 8px 6px; font-size: 11px; border-bottom: 2px solid #cbd5e1; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">SR LOGÍSTICA & TRANSPORTE CORPORATIVO</div>
            <div style="font-size: 11px; color: #64748b;">Relatório Consolidado de Faturamento e Corridas</div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div>Emissão: ${new Date().toLocaleString('pt-BR')}</div>
            <div><strong>Filtro: ${periodFilter} (${summary.passengersList.length} passageiros)</strong></div>
          </div>
        </div>

        <div class="grid">
          <div class="box"><div style="font-size:10px; color:#64748b;">Total de Corridas</div><div style="font-size:16px; font-weight:bold;">${summary.totalRides}</div></div>
          <div class="box"><div style="font-size:10px; color:#64748b;">Corridas Concluídas</div><div style="font-size:16px; font-weight:bold; color:#10b981;">${summary.completedCount}</div></div>
          <div class="box"><div style="font-size:10px; color:#64748b;">Quilometragem Total</div><div style="font-size:16px; font-weight:bold;">${summary.totalKm.toFixed(1)} km</div></div>
          <div class="box" style="background:#0f172a; color:#fff;"><div style="font-size:10px; color:#94a3b8;">Faturamento Total</div><div style="font-size:16px; font-weight:bold; color:#38bdf8;">R$ ${summary.totalFare.toFixed(2)}</div></div>
        </div>

        ${passSummaryHtml}

        <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
          ● Detalhamento Individual de Viagens
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;">#</th>
              <th>Data/Hora</th>
              <th>Passageiro</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Motorista</th>
              <th style="text-align:center;">Km</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 300); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (filteredRides.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const headers = ["ID", "Data_Hora", "Passageiro", "Origem", "Destino", "Motorista", "KM", "Status", "Forma_Pagamento", "Valor_R$"];
    const rows = filteredRides.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.created_at).toLocaleString('pt-BR')}"`,
      `"${r.passenger_name || 'Passageiro'}"`,
      `"${(r.pickup_address || '').replace(/"/g, '""')}"`,
      `"${(r.dropoff_address || '').replace(/"/g, '""')}"`,
      `"${(r.driver_name || '').replace(/"/g, '""')}"`,
      `"${r.distance_km || 0}"`,
      `"${r.status}"`,
      `"${r.payment_method || 'PIX'}"`,
      `"${r.fare_amount.toFixed(2).replace('.', ',')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_geral_corridas_sr_${Date.now()}.csv`;
    link.click();
  };

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
                <span>Painel Gerencial SR</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Controle operacional, motoristas e faturamento</p>
            </div>
          </div>
          <a
            href="https://www.srlogisticatrasporte.com.br/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-brand text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs hover:brightness-105 active:scale-[0.98] transition shadow-md shadow-brand/20 shrink-0"
          >
            <span>Central Web</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Tabs Principais do Painel */}
      <div className="flex rounded-2xl bg-slate-200/70 dark:bg-dark-800 p-1 border border-slate-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab('DRIVERS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'DRIVERS'
              ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={16} />
          <span>Motoristas & Aprovações ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'REPORTS'
              ? 'bg-brand text-slate-950 shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={16} />
          <span>Relatórios Quinzenal / Mensal</span>
        </button>
      </div>

      {/* ABA 1: MOTORISTAS & DASHBOARD OPERACIONAL */}
      {activeTab === 'DRIVERS' && (
        <>
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
          </div>

          <div className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className="mb-0">Aprovações & Gestão de Motoristas</SectionTitle>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800 px-3 py-1 rounded-full border border-slate-200 dark:border-dark-700">
                Total: {drivers.length} cadastrados
              </span>
            </div>

            {successMessage && (
              <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check size={16} />
                  {successMessage}
                </span>
                <button type="button" onClick={() => setSuccessMessage("")} className="opacity-70 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            )}

            <Card className="p-0 shadow-sm overflow-hidden">
              {error && <div className="border-b border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}
              {loadingDrivers ? (
                <div className="p-6 text-center text-sm text-slate-500">Carregando solicitações...</div>
              ) : drivers.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">Nenhum motorista cadastrado.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-dark-700">
                  {drivers.map((driver) => {
                    const isPendingVehicle = driver.vehicle_status === "Pendente" && driver.status === "Aprovado";
                    const isPending = driver.status === "Pendente" || driver.vehicle_status === "Pendente";
                    const displayName = driver.nome_social || driver.nome || driver.nome_completo || "Motorista";
                    const currentType = (driver.tipo_motorista || driver.driver_type || driver.perfil_motorista || driver.categoria_motorista || 'PARTICULAR').toUpperCase() === 'EMPRESA' ? 'EMPRESA' : 'PARTICULAR';
                    const isUpdatingThis = updatingDriverId === driver.id;
                    const isUpdatingPhoto = updatingPhotoDriverId === driver.id;
                    const photoUrl = driver.pending_avatar_url || driver.avatar_url;
                    const photoStatus = driver.foto_status || driver.avatar_status || (photoUrl ? 'Aguardando aprovação' : 'Sem foto');

                    return (
                      <div key={driver.id} className="flex flex-col gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-dark-800/40 transition">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Coluna 1: Foto do Motorista e Dados Principais */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Avatar com Thumbnail e Ação de Visualizar */}
                            <div className="relative shrink-0">
                              <div
                                onClick={() => {
                                  if (photoUrl) {
                                    setPhotoModal({
                                      url: photoUrl,
                                      name: displayName,
                                      driverId: driver.id,
                                      status: photoStatus,
                                    });
                                  }
                                }}
                                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-slate-100 dark:bg-dark-800 ${
                                  photoUrl ? 'cursor-pointer hover:opacity-90 ring-2 ring-brand/30' : ''
                                } ${
                                  photoStatus === 'Aprovado'
                                    ? 'border-emerald-500'
                                    : photoStatus === 'Reprovado'
                                    ? 'border-red-500'
                                    : photoUrl
                                    ? 'border-amber-500'
                                    : 'border-slate-300 dark:border-dark-700'
                                }`}
                                title={photoUrl ? "Clique para ampliar e revisar foto" : "Sem foto de perfil"}
                              >
                                {photoUrl ? (
                                  <img
                                    src={photoUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-dark-800 dark:to-dark-700 text-slate-500 font-bold text-lg">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {photoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPhotoModal({
                                    url: photoUrl,
                                    name: displayName,
                                    driverId: driver.id,
                                    status: photoStatus,
                                  })}
                                  className="absolute -bottom-1 -right-1 p-1 bg-slate-900 text-white rounded-full text-[9px] shadow hover:bg-slate-800"
                                  title="Ampliar foto"
                                >
                                  <Eye size={10} />
                                </button>
                              )}
                            </div>

                            {/* Informações Textuais */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                  {displayName}
                                </span>
                                {isPendingVehicle && (
                                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    Troca de Carro
                                  </span>
                                )}
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                  !isPending && driver.status === 'Aprovado'
                                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                    : driver.status === 'Reprovado' || driver.vehicle_status === 'Reprovado'
                                    ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                    : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                                }`}>
                                  Cadastro: {isPendingVehicle ? 'Carro em Análise' : driver.status}
                                </span>

                                {/* Tag de Status da Foto */}
                                {photoUrl ? (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    photoStatus === 'Aprovado'
                                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                      : photoStatus === 'Reprovado'
                                      ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                                  }`}>
                                    <Camera size={10} />
                                    <span>Foto: {photoStatus}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    (Sem foto de perfil)
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {driver.marca_veiculo || ''} {driver.modelo_veiculo || ''} {driver.placa_veiculo ? `(${driver.placa_veiculo})` : ''} {driver.telefone ? `• ${driver.telefone}` : ''}
                                {driver.email ? ` • ${driver.email}` : ''}
                              </div>
                            </div>
                          </div>

                          {/* Ações de Aprovação do Cadastro Geral */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isPending && (
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-900 p-1 rounded-xl border border-slate-200 dark:border-dark-700">
                                <span className="text-[10px] font-bold text-slate-500 px-1">Cadastro:</span>
                                <button type="button" aria-label={`Aprovar Cadastro ${displayName}`} onClick={() => updateDriverStatus(driver.id, 'Aprovado')} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white font-bold hover:bg-emerald-700 transition flex items-center gap-1" title="Aprovar Cadastro">
                                  <Check size={13} />
                                  <span>Aprovar</span>
                                </button>
                                <button type="button" aria-label={`Reprovar Cadastro ${displayName}`} onClick={() => updateDriverStatus(driver.id, 'Reprovado')} className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white font-bold hover:bg-red-700 transition flex items-center gap-1" title="Reprovar Cadastro">
                                  <X size={13} />
                                  <span>Reprovar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Linha 2: Controles do Administrador (Aprovação de Foto e Categoria Exclusiva) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-dark-700/80 flex flex-wrap items-center justify-between gap-3">
                          {/* SELETOR EXCLUSIVO ADMIN: CATEGORIA DO MOTORISTA */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              Categoria do Motorista (Definição Exclusiva Admin):
                            </span>
                            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                              <button
                                type="button"
                                disabled={isUpdatingThis}
                                onClick={() => updateDriverType(driver.id, 'PARTICULAR')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                                  currentType === 'PARTICULAR'
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Motorista Particular: Recebe corridas particulares (-20% taxa) e vouchers corporativos"
                              >
                                🚗 Motorista Particular (-20%)
                              </button>
                              <button
                                type="button"
                                disabled={isUpdatingThis}
                                onClick={() => updateDriverType(driver.id, 'EMPRESA')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                                  currentType === 'EMPRESA'
                                    ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Motorista Empresa: Atendimento exclusivo a vouchers corporativos (100% repasse integral)"
                              >
                                🏢 Motorista Empresa (Voucher)
                              </button>
                            </div>
                            {isUpdatingThis && (
                              <span className="text-[10px] text-brand animate-pulse font-bold">Salvando categoria...</span>
                            )}
                          </div>

                          {/* BOTÕES DE APROVAÇÃO DA FOTO DE PERFIL */}
                          {photoUrl && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                Foto de Perfil:
                              </span>
                              <button
                                type="button"
                                disabled={isUpdatingPhoto}
                                onClick={() => updateDriverPhotoStatus(driver.id, 'Aprovado')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  photoStatus === 'Aprovado'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                                }`}
                                title="Aprovar foto de perfil do motorista"
                              >
                                <CheckCircle2 size={12} />
                                <span>Aprovar Foto</span>
                              </button>
                              <button
                                type="button"
                                disabled={isUpdatingPhoto}
                                onClick={() => updateDriverPhotoStatus(driver.id, 'Reprovado')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  photoStatus === 'Reprovado'
                                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/40'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white'
                                }`}
                                title="Rejeitar foto de perfil do motorista"
                              >
                                <XCircle size={12} />
                                <span>Rejeitar Foto</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ABA 2: RELATÓRIO GERAL DE FATURAMENTO & MULTI-PASSAGEIROS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          {/* Card de Filtros */}
          <Card className="p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-700">
              <div className="flex items-center gap-2 font-black text-xs uppercase text-slate-700 dark:text-slate-300">
                <Filter size={16} className="text-brand" />
                <span>Filtro de Faturamento & Período</span>
              </div>
              <button onClick={() => loadAllRides()} className="text-xs font-bold text-brand hover:underline">
                Atualizar Dados
              </button>
            </div>

            {/* Períodos */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                onClick={() => setPeriodFilter('Q1')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'Q1' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                1ª Quinzena
              </button>
              <button
                onClick={() => setPeriodFilter('Q2')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'Q2' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                2ª Quinzena
              </button>
              <button
                onClick={() => setPeriodFilter('CURRENT_MONTH')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'CURRENT_MONTH' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                Este Mês
              </button>
              <button
                onClick={() => setPeriodFilter('LAST_MONTH')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'LAST_MONTH' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                Mês Anterior
              </button>
              <button
                onClick={() => setPeriodFilter('ALL')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'ALL' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setPeriodFilter('CUSTOM')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  periodFilter === 'CUSTOM' ? 'bg-brand text-slate-950 border-brand font-black' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700'
                }`}
              >
                Personalizado
              </button>
            </div>
          </Card>

          {/* Totalizadores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Total</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {summary.totalFare.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">{summary.completedCount} corridas pagas</div>
            </Card>
            <Card className="p-3.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total de Viagens</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{summary.totalRides}</div>
              <div className="text-[10px] text-slate-400">Solicitações</div>
            </Card>
            <Card className="p-3.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Quilometragem</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{summary.totalKm.toFixed(1)} km</div>
              <div className="text-[10px] text-slate-400">Distância total</div>
            </Card>
            <Card className="p-3.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Ticket Médio</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">R$ {summary.avgFare.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">Por corrida</div>
            </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl text-xs hover:bg-black transition shadow-md"
            >
              <Printer size={16} />
              <span>Imprimir / Salvar Relatório PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-2xl text-xs hover:bg-emerald-700 transition shadow-md"
            >
              <Download size={16} />
              <span>Exportar Planilha Excel (.CSV)</span>
            </button>
          </div>

          {/* Resumo Consolidado de Todos os Passageiros */}
          {summary.passengersList.length > 0 && (
            <Card className="p-0 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-dark-700 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  Resumo de Todos os Passageiros ({summary.passengersList.length})
                </span>
                <span className="text-[10px] text-slate-400">Clique para filtrar</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dark-700 max-h-60 overflow-y-auto">
                {summary.passengersList.map((p) => {
                  const isSelected = selectedPassenger === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPassenger(isSelected ? 'ALL' : p.id)}
                      className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition ${
                        isSelected ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isSelected && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">FILTRADO</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.completedCount} viagens concluídas ({p.ridesCount} totais) • {p.totalKm.toFixed(1)} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600 dark:text-emerald-400">R$ {p.totalFare.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">{isSelected ? 'Remover filtro' : 'Filtrar'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Tabela de Corridas */}
          <Card className="p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-dark-700 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Detalhamento Individual de Corridas ({filteredRides.length})
              </span>
            </div>

            {loadingRides ? (
              <div className="p-8 text-center text-xs text-slate-400">Carregando dados...</div>
            ) : filteredRides.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Nenhuma corrida encontrada no período.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-dark-700 max-h-[500px] overflow-y-auto">
                {filteredRides.map((ride, idx) => (
                  <div key={ride.id} className="p-4 space-y-2 hover:bg-slate-50 dark:hover:bg-dark-800 transition text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ride.passenger_name || 'Passageiro SR'}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded text-slate-500 font-semibold">{ride.payment_method || 'Voucher'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">R$ {ride.fare_amount.toFixed(2)}</span>
                        <span className="ml-2 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">{ride.status}</span>
                      </div>
                    </div>

                    {/* Origem e Destino com ícones e links */}
                    <div className="space-y-1 pl-2 border-l-2 border-slate-200 dark:border-dark-600 text-[11px]">
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-emerald-500 font-bold shrink-0">● Embarque:</span>
                        <span className="break-words">{ride.pickup_address}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-amber-500 font-bold shrink-0">● Desembarque:</span>
                        <span className="break-words">{ride.dropoff_address}</span>
                      </div>
                    </div>

                    {/* Detalhes de Rodapé */}
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1">
                      <div>
                        <span>{new Date(ride.created_at).toLocaleString('pt-BR')}</span>
                        <span className="mx-1.5">•</span>
                        <span>Motorista: <strong className="text-slate-700 dark:text-slate-300">{ride.driver_name}</strong></span>
                      </div>
                      <div className="flex items-center gap-3">
                        {ride.distance_km && <span className="font-mono font-bold">{ride.distance_km.toFixed(1)} km</span>}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickup_address)}&destination=${encodeURIComponent(ride.dropoff_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand font-bold hover:underline"
                        >
                          Ver Rota Maps ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL DE INSPEÇÃO E APROVAÇÃO DA FOTO DE PERFIL */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Revisão da Foto de Perfil
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {photoModal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModal(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Imagem Ampliada */}
            <div className="relative aspect-square max-h-72 w-full mx-auto rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-dark-700">
              <img
                src={photoModal.url}
                alt={photoModal.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase shadow ${
                  photoModal.status === 'Aprovado'
                    ? 'bg-emerald-500 text-slate-950'
                    : photoModal.status === 'Reprovado'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {photoModal.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Verifique se a imagem possui boa iluminação, enquadramento frontal e identificação nítida do motorista antes de aprovar.
            </p>

            {/* Ações do Administrador */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => updateDriverPhotoStatus(photoModal.driverId, 'Aprovado')}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 size={16} />
                <span>Aprovar Foto</span>
              </button>
              <button
                type="button"
                onClick={() => updateDriverPhotoStatus(photoModal.driverId, 'Reprovado')}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md shadow-red-600/20"
              >
                <XCircle size={16} />
                <span>Rejeitar Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
