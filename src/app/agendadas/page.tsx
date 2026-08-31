"use client";

import React, { useEffect, useState } from "react";
import { CalendarPlus, Menu, RefreshCw, Target, X, MapPin, Clock, Calendar as CalendarIcon, Tag } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AgendadasPage() {
  const initialAgendamentos = [
    { id: 1, area: "14-PRACA14", veiculos: "", min15: "", min30: "", min45: "1", endereco: "Praça 14, Centro", data: "2026-09-01", hora: "08:00", referencia: "Próximo ao Banco do Brasil" },
    { id: 2, area: "19- DB COR", veiculos: "1", min15: "", min30: "", min45: "", endereco: "Rua DB, Cor", data: "2026-09-01", hora: "09:30", referencia: "Em frente ao Mercado" },
    { id: 3, area: "20-ANA BRA", veiculos: "", min15: "", min30: "", min45: "2", endereco: "Av Ana Brasil, 100", data: "2026-09-02", hora: "14:00", referencia: "Ao lado da Farmácia" },
  ];

  type Agendamento = (typeof initialAgendamentos)[number];
  type AgendamentoCompleto = Agendamento & { endereco?: string };

  const [agendamentos, setAgendamentos] = useState<AgendamentoCompleto[]>(initialAgendamentos);
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(4);
  const [selectedArea, setSelectedArea] = useState<AgendamentoCompleto | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  
  // Novos estados para o formulário de agendamento completo
  const [newArea, setNewArea] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newReference, setNewReference] = useState("");
  const [newWindow, setNewWindow] = useState<"15" | "30" | "45">("15");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsUntilUpdate((seconds) => {
        if (seconds <= 1) {
          setLastUpdated(new Date());
          return 4;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshAreas = () => {
    setLastUpdated(new Date());
    setSecondsUntilUpdate(4);
  };

  const createAgendamento = (event: React.FormEvent) => {
    event.preventDefault();
    const area = newArea.trim().toUpperCase();
    const address = newAddress.trim();
    if (!area || !address) return;

    const newAgendamento: AgendamentoCompleto = {
      id: Date.now(),
      area,
      endereco: address,
      data: newDate,
      hora: newTime,
      referencia: newReference,
      veiculos: "1",
      min15: newWindow === "15" ? "1" : "",
      min30: newWindow === "30" ? "1" : "",
      min45: newWindow === "45" ? "1" : "",
    };
    setAgendamentos((current) => [newAgendamento, ...current]);
    
    // Reset form
    setNewArea("");
    setNewAddress("");
    setNewDate("");
    setNewTime("");
    setNewReference("");
    setNewWindow("15");
    setCreateOpen(false);
    refreshAreas();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark flex flex-col pb-24 font-sans text-slate-900 dark:text-slate-200 transition-colors">
      <header className="bg-white/80 dark:bg-surface/80 backdrop-blur-md text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Abrir menu" className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10">
              <Menu size={26} className="text-slate-600 dark:text-white/90" />
            </button>
            <span className="text-lg font-bold tracking-wide">093 | LIVRE</span>
          </div>
          <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] border-2 border-white dark:border-white/6" />
        </div>
        <div className="flex text-sm font-medium">
          <Link href="/" className="flex-1 text-center py-3 text-slate-500 dark:text-white/70 hover:text-brand transition">MAPA</Link>
          <div className="flex-1 text-center py-3 border-b-[3px] border-brand text-brand dark:text-white">ÁREAS/PAs</div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4">
        <div className="w-full bg-white dark:bg-surface/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-slate-200 dark:border-white/6">
          <table className="w-full text-center text-[14px] text-slate-600 dark:text-slate-300">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-white/6">
                <th className="py-3 px-1 font-semibold flex items-center justify-center gap-1"><span className="text-brand-600 dark:text-brand-400 font-bold text-lg leading-none">↑↓</span> Área</th>
                <th className="py-3 px-1 font-normal border-l border-slate-200 dark:border-white/6">Veículos</th>
                <th className="py-3 px-1 font-normal border-l border-slate-200 dark:border-white/6">15</th>
                <th className="py-3 px-1 font-normal border-l border-slate-200 dark:border-white/6">30</th>
                <th className="py-3 px-1 font-normal border-l border-slate-200 dark:border-white/6">45+</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((item) => (
                <tr key={item.id} className="border-b border-slate-200 dark:border-white/6 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition" onClick={() => setSelectedArea(item)}>
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap px-1">{item.area}</td>
                  <td className="py-3 border-l border-slate-200 dark:border-white/6">{item.veiculos}</td>
                  <td className="py-3 border-l border-slate-200 dark:border-white/6">{item.min15}</td>
                  <td className="py-3 border-l border-slate-200 dark:border-white/6 text-slate-900 dark:text-slate-100 font-medium">{item.min30}</td>
                  <td className="py-3 border-l border-slate-200 dark:border-white/6">{item.min45}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-200 dark:border-white/6 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>

        {selectedArea && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelectedArea(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-surface p-6 shadow-2xl transition-all" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">Detalhes do Agendamento</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{selectedArea.area}</h2>
                </div>
                <button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedArea(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} /></button>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <MapPin size={18} className="text-brand mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Endereço</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{selectedArea.endereco || 'Não informado'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <CalendarIcon size={18} className="text-brand mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Data e Hora</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{selectedArea.data || '---'} às {selectedArea.hora || '--:--'}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <Tag size={18} className="text-brand mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Referência</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{selectedArea.referencia || 'Sem referência'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <strong className="block text-lg font-bold text-slate-900 dark:text-slate-100">{selectedArea.veiculos || '0'}</strong>
                  <span className="text-[10px] text-slate-500">Veículos</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <strong className="block text-lg font-bold text-slate-900 dark:text-slate-100">{selectedArea.min15 || '0'}</strong>
                  <span className="text-[10px] text-slate-500">15 min</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <strong className="block text-lg font-bold text-slate-900 dark:text-slate-100">{selectedArea.min30 || '0'}</strong>
                  <span className="text-[10px] text-slate-500">30 min</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <strong className="block text-lg font-bold text-slate-900 dark:text-slate-100">{selectedArea.min45 || '0'}</strong>
                  <span className="text-[10px] text-slate-500">45+ min</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedArea(null)} className="mt-6 w-full rounded-xl bg-brand py-3 font-bold text-white hover:bg-brand-600 transition active:scale-[0.98]">Fechar detalhes</button>
            </div>
          </div>
        )}

        {createOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCreateOpen(false)}>
            <form onSubmit={createAgendamento} className="w-full max-w-sm rounded-2xl bg-white dark:bg-surface p-6 shadow-2xl transition-all" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">Novo Agendamento</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">Criar Posição</h2>
                </div>
                <button type="button" aria-label="Fechar criação" onClick={() => setCreateOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"><X size={20} /></button>
              </div>
              
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Área de Manaus
                  <input value={newArea} onChange={(event) => setNewArea(event.target.value)} placeholder="Ex.: Ponta Negra" required className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white" />
                </label>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Endereço de embarque
                  <input value={newAddress} onChange={(event) => setNewAddress(event.target.value)} placeholder="Rua, número..." required className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Data
                    <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Hora
                    <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white" />
                  </label>
                </div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Referência
                  <input value={newReference} onChange={(event) => setNewReference(event.target.value)} placeholder="Ex.: Próximo ao Banco do Brasil" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white" />
                </label>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Janela de espera
                  <select value={newWindow} onChange={(event) => setNewWindow(event.target.value as typeof newWindow)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/50 dark:text-white">
                    <option value="15">Até 15 minutos</option>
                    <option value="30">De 15 a 30 minutos</option>
                    <option value="45">Acima de 45 minutos</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-brand py-3 font-bold text-white hover:bg-brand-600 transition active:scale-[0.98] shadow-lg shadow-brand/30">Criar agendamento</button>
            </form>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-0 w-full px-4 flex items-center justify-between pointer-events-none z-10">
        <button onClick={() => setCreateOpen(true)} className="w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-brand-600 transition active:scale-90"><Target size={24} /></button>
        <span className="text-sm text-slate-500 dark:text-slate-300 pr-10 bg-white/80 dark:bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">Atualizando em {secondsUntilUpdate}...</span>
      </div>

      <BottomNav />
    </div>
  );
}
