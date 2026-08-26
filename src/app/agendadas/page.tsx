'use client';

import React, { useEffect, useState } from 'react';
import { CalendarPlus, Menu, RefreshCw, Target, X } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function AgendadasPage() {
  // Dados de exemplo baseados na foto
  const initialAgendamentos = [
    { id: 1, area: '14-PRACA14', veiculos: '', min15: '', min30: '', min45: '1' },
    { id: 2, area: '19- DB COR', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 3, area: '20-ANA BRA', veiculos: '', min15: '', min30: '', min45: '2' },
  ];
  type Agendamento = (typeof initialAgendamentos)[number];
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(initialAgendamentos);
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState(4);
  const [selectedArea, setSelectedArea] = useState<Agendamento | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [newWindow, setNewWindow] = useState<'15' | '30' | '45'>('15');

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
    if (!area) return;
    const newAgendamento: Agendamento = {
      id: Date.now(),
      area,
      veiculos: '1',
      min15: newWindow === '15' ? '1' : '',
      min30: newWindow === '30' ? '1' : '',
      min45: newWindow === '45' ? '1' : '',
    };
    setAgendamentos((current) => [newAgendamento, ...current]);
    setNewArea('');
    setNewWindow('15');
    setCreateOpen(false);
    refreshAreas();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col pb-20 font-sans">
      {/* Cabeçalho Azul Estilo Foto */}
      <header className="bg-[#2B3B96] text-white pt-4">
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Abrir menu" className="rounded-md p-1 hover:bg-white/10">
              <Menu size={26} className="text-white/90" />
            </button>
            <span className="text-lg tracking-wide">093 | LIVRE</span>
          </div>
          {/* Indicador Verde */}
          <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] border-2 border-[#2B3B96]"></div>
        </div>
        
        {/* Abas */}
        <div className="flex text-sm font-medium">
          <Link href="/" className="flex-1 text-center py-3 text-white/70 hover:text-white transition">
            MAPA
          </Link>
          <div className="flex-1 text-center py-3 border-b-[3px] border-[#38B6FF] text-white">
            ÁREAS/PAs
          </div>
        </div>
      </header>

      <main className="flex-1 bg-[#F5F5F5] pt-2">
        {/* Tabela de Agendamentos */}
        <div className="w-full bg-white shadow-sm border-t border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs text-gray-500">
            <span>Áreas de Manaus</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCreateOpen(true)} className="flex items-center gap-1 rounded-md bg-[#2B3B96] px-2 py-1 font-semibold text-white hover:bg-[#24327f]">
                <CalendarPlus size={13} /> Agendar
              </button>
              <button type="button" aria-label="Atualizar áreas" onClick={refreshAreas} className="rounded-md p-1 text-blue-600 hover:bg-blue-50">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
          <table className="w-full text-center text-[14px] text-gray-600">
            <thead className="text-gray-500">
              <tr className="border-b border-gray-300">
                <th className="py-3 px-1 font-semibold flex items-center justify-center gap-1">
                  <span className="text-blue-500 font-bold text-lg leading-none">↑↓</span> Área
                </th>
                <th className="py-3 px-1 font-normal border-l border-gray-300">Veículos</th>
                <th className="py-3 px-1 font-normal border-l border-gray-300">15</th>
                <th className="py-3 px-1 font-normal border-l border-gray-300">30</th>
                <th className="py-3 px-1 font-normal border-l border-gray-300">45+</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 font-bold text-gray-700 whitespace-nowrap px-1">
                    <button type="button" onClick={() => setSelectedArea(item)} className="w-full text-left px-1 hover:text-blue-700">
                      {item.area}
                    </button>
                  </td>
                  <td className="py-3 border-l border-gray-200">{item.veiculos}</td>
                  <td className="py-3 border-l border-gray-200">{item.min15}</td>
                  <td className="py-3 border-l border-gray-200 text-gray-900 font-medium">{item.min30}</td>
                  <td className="py-3 border-l border-gray-200">{item.min45}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-200 px-3 py-2 text-[11px] text-gray-400">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {selectedArea && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelectedArea(null)}>
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Área selecionada</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-800">{selectedArea.area}</h2>
                </div>
                <button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedArea(null)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-4 divide-x rounded-lg border border-gray-200 py-3 text-center text-sm text-gray-600">
                <span><strong className="block text-lg text-gray-900">{selectedArea.veiculos || '0'}</strong>veículos</span>
                <span><strong className="block text-lg text-gray-900">{selectedArea.min15 || '0'}</strong>15 min</span>
                <span><strong className="block text-lg text-gray-900">{selectedArea.min30 || '0'}</strong>30 min</span>
                <span><strong className="block text-lg text-gray-900">{selectedArea.min45 || '0'}</strong>45+ min</span>
              </div>
              <button type="button" onClick={() => setSelectedArea(null)} className="mt-5 w-full rounded-lg bg-[#2B3B96] py-3 font-semibold text-white hover:bg-[#24327f]">Fechar detalhes</button>
            </div>
          </div>
        )}

        {createOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCreateOpen(false)}>
            <form onSubmit={createAgendamento} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Novo agendamento</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-800">Criar posição</h2>
                </div>
                <button type="button" aria-label="Fechar criação" onClick={() => setCreateOpen(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
              <label className="mt-5 block text-sm font-semibold text-gray-700">
                Área de Manaus
                <input value={newArea} onChange={(event) => setNewArea(event.target.value)} placeholder="Ex.: Ponta Negra" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-600" />
              </label>
              <label className="mt-4 block text-sm font-semibold text-gray-700">
                Janela de espera
                <select value={newWindow} onChange={(event) => setNewWindow(event.target.value as typeof newWindow)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-600">
                  <option value="15">Até 15 minutos</option>
                  <option value="30">De 15 a 30 minutos</option>
                  <option value="45">Acima de 45 minutos</option>
                </select>
              </label>
              <button type="submit" className="mt-5 w-full rounded-lg bg-[#2B3B96] py-3 font-semibold text-white hover:bg-[#24327f]">Criar agendamento</button>
            </form>
          </div>
        )}
      </main>

      {/* Elementos Inferiores Estilo Foto */}
      <div className="fixed bottom-24 left-0 w-full px-4 flex items-center justify-between pointer-events-none z-10">
        <button type="button" aria-label="Voltar ao início da lista" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-14 h-14 bg-[#38B6FF] text-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-[#2fa0e6] transition">
          <Target size={24} />
        </button>
        <span className="text-sm text-gray-500 pr-10 bg-white/80 px-2 py-1 rounded-md">Atualizando em {secondsUntilUpdate}...</span>
      </div>

      {/* Navegação Inferior Padrão do App */}
      <BottomNav />
    </div>
  );
}