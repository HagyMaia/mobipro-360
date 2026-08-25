'use client';

import React from 'react';
import { Menu, Target } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function AgendadasPage() {
  // Dados de exemplo baseados na foto
  const agendamentos = [
    { id: 1, area: '14-PRACA14', veiculos: '', min15: '', min30: '', min45: '1' },
    { id: 2, area: '19- DB COR', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 3, area: '20-ANA BRA', veiculos: '', min15: '', min30: '', min45: '2' },
    { id: 4, area: '22-PQDEZ', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 5, area: '25-JAPIM L', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 6, area: '27-MOURA T', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 7, area: '31-H DELPH', veiculos: '', min15: '', min30: '', min45: '2' },
    { id: 8, area: '5-CARREFO U', veiculos: '1', min15: '', min30: '', min45: '' },
    { id: 9, area: '7-N ERA AL', veiculos: '1', min15: '', min30: '', min45: '1' },
    { id: 10, area: '8-NOVAE CN', veiculos: '1', min15: '', min30: '', min45: '' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col pb-20 font-sans">
      {/* Cabeçalho Azul Estilo Foto */}
      <header className="bg-[#2B3B96] text-white pt-4">
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            <Menu size={26} className="text-white/90" />
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
                  <td className="py-3 font-bold text-gray-700 whitespace-nowrap px-1">{item.area}</td>
                  <td className="py-3 border-l border-gray-200">{item.veiculos}</td>
                  <td className="py-3 border-l border-gray-200">{item.min15}</td>
                  <td className="py-3 border-l border-gray-200 text-gray-900 font-medium">{item.min30}</td>
                  <td className="py-3 border-l border-gray-200">{item.min45}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Elementos Inferiores Estilo Foto */}
      <div className="fixed bottom-24 left-0 w-full px-4 flex items-center justify-between pointer-events-none z-10">
        <button className="w-14 h-14 bg-[#38B6FF] text-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-[#2fa0e6] transition">
          <Target size={24} />
        </button>
        <span className="text-sm text-gray-500 pr-10 bg-white/80 px-2 py-1 rounded-md">Atualizando em 4...</span>
      </div>

      {/* Navegação Inferior Padrão do App */}
      <BottomNav />
    </div>
  );
}