"use client";

import React, { useEffect, useState } from "react";
import { CalendarPlus, Menu, RefreshCw, Target, X } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AgendadasPage() {
  const initialAgendamentos = [
    { id: 1, area: "14-PRACA14", veiculos: "", min15: "", min30: "", min45: "1" },
    { id: 2, area: "19- DB COR", veiculos: "1", min15: "", min30: "", min45: "" },
    { id: 3, area: "20-ANA BRA", veiculos: "", min15: "", min30: "", min45: "2" },
  ];

  type Agendamento = (typeof initialAgendamentos)[number];
  type AgendamentoCompleto = Agendamento & { endereco?: string };

  const [agendamentos, setAgendamentos] = useState<AgendamentoCompleto[]>(initialAgendamentos);
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(4);
  const [selectedArea, setSelectedArea] = useState<AgendamentoCompleto | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [newAddress, setNewAddress] = useState("");
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
      veiculos: "1",
      min15: newWindow === "15" ? "1" : "",
      min30: newWindow === "30" ? "1" : "",
      min45: newWindow === "45" ? "1" : "",
    };
    setAgendamentos((current) => [newAgendamento, ...current]);
    setNewArea("");
    setNewAddress("");
    setNewWindow("15");
    setCreateOpen(false);
    refreshAreas();
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col pb-24 font-sans text-slate-200">
      <header className="bg-[color:var(--surface)]/80 text-white pt-4">
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Abrir menu" className="rounded-md p-1 hover:bg-white/10">
              <Menu size={26} className="text-white/90" />
            </button>
            <span className="text-lg tracking-wide">093 | LIVRE</span>
          </div>
          <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] border-2 border-white/6" />
        </div>
        <div className="flex text-sm font-medium">
          <Link href="/" className="flex-1 text-center py-3 text-white/70 hover:text-white transition">MAPA</Link>
          <div className="flex-1 text-center py-3 border-b-[3px] border-brand text-white">ÁREAS/PAs</div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4">
        <div className="w-full bg-surface/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/6">
          <table className="w-full text-center text-[14px] text-slate-300">
            <thead className="text-slate-400">
              <tr className="border-b border-white/6">
                <th className="py-3 px-1 font-semibold flex items-center justify-center gap-1"><span className="text-brand-600 font-bold text-lg leading-none">↑↓</span> Área</th>
                <th className="py-3 px-1 font-normal border-l border-white/6">Veículos</th>
                <th className="py-3 px-1 font-normal border-l border-white/6">15</th>
                <th className="py-3 px-1 font-normal border-l border-white/6">30</th>
                <th className="py-3 px-1 font-normal border-l border-white/6">45+</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((item) => (
                <tr key={item.id} className="border-b border-white/6">
                  <td className="py-3 font-bold text-slate-100 whitespace-nowrap px-1">{item.area}</td>
                  <td className="py-3 border-l border-white/6">{item.veiculos}</td>
                  <td className="py-3 border-l border-white/6">{item.min15}</td>
                  <td className="py-3 border-l border-white/6 text-slate-100 font-medium">{item.min30}</td>
                  <td className="py-3 border-l border-white/6">{item.min45}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/6 px-3 py-2 text-[11px] text-slate-400">Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>

        {selectedArea && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelectedArea(null)}>
            <div className="w-full max-w-sm rounded-xl bg-[color:var(--surface)] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Área selecionada</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-100">{selectedArea.area}</h2>
                </div>
                <button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedArea(null)} className="rounded-full p-1 text-slate-400 hover:bg-white/6"><X size={20} /></button>
              </div>
              <div className="mt-4 rounded-lg bg-white/6 px-3 py-2 text-sm text-slate-300">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Endereço de embarque</span>
                <span className="mt-1 block">{selectedArea.endereco || 'Endereço não informado'}</span>
              </div>
              <div className="mt-5 grid grid-cols-4 divide-x rounded-lg border border-white/6 py-3 text-center text-sm text-slate-300">
                <span><strong className="block text-lg text-slate-100">{selectedArea.veiculos || '0'}</strong>veículos</span>
                <span><strong className="block text-lg text-slate-100">{selectedArea.min15 || '0'}</strong>15 min</span>
                <span><strong className="block text-lg text-slate-100">{selectedArea.min30 || '0'}</strong>30 min</span>
                <span><strong className="block text-lg text-slate-100">{selectedArea.min45 || '0'}</strong>45+ min</span>
              </div>
              <button type="button" onClick={() => setSelectedArea(null)} className="mt-5 w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-600">Fechar detalhes</button>
            </div>
          </div>
        )}

        {createOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCreateOpen(false)}>
            <form onSubmit={createAgendamento} className="w-full max-w-sm rounded-xl bg-[color:var(--surface)] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Novo agendamento</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-100">Criar posição</h2>
                </div>
                <button type="button" aria-label="Fechar criação" onClick={() => setCreateOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-white/6"><X size={20} /></button>
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-200">Área de Manaus
                <input value={newArea} onChange={(event) => setNewArea(event.target.value)} placeholder="Ex.: Ponta Negra" required className="mt-1 w-full rounded-lg border border-white/6 px-3 py-2 font-normal outline-none focus:border-brand" />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-200">Endereço de embarque
                <input value={newAddress} onChange={(event) => setNewAddress(event.target.value)} placeholder="Rua, número e referência" required className="mt-1 w-full rounded-lg border border-white/6 px-3 py-2 font-normal outline-none focus:border-brand" />
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-200">Janela de espera
                <select value={newWindow} onChange={(event) => setNewWindow(event.target.value as typeof newWindow)} className="mt-1 w-full rounded-lg border border-white/6 px-3 py-2 font-normal outline-none focus:border-brand">
                  <option value="15">Até 15 minutos</option>
                  <option value="30">De 15 a 30 minutos</option>
                  <option value="45">Acima de 45 minutos</option>
                </select>
              </label>
              <button type="submit" className="mt-5 w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-600">Criar agendamento</button>
            </form>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-0 w-full px-4 flex items-center justify-between pointer-events-none z-10">
        <button className="w-14 h-14 bg-brand text-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-brand-600 transition"><Target size={24} /></button>
        <span className="text-sm text-slate-300 pr-10 bg-white/4 px-2 py-1 rounded-md">Atualizando em {secondsUntilUpdate}...</span>
      </div>

      <BottomNav />
    </div>
  );
}
