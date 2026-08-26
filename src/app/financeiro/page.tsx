'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';

export default function FinanceiroPage() {
  // Valores para demonstração do visual (podem ser conectados ao banco depois)
  const ganhosHoje = 150.00;
  const ganhosMes = 3450.00;
  
  // Cálculo do líquido (Ex: desconta 10% de taxa da plataforma)
  const taxaPlataforma = 0.10;
  const liquidoMes = ganhosMes - (ganhosMes * taxaPlataforma);

  return (
    <div className="min-h-screen bg-dark pb-24 font-sans text-slate-200">
      <header className="bg-brand-700 p-6 pt-10 text-white shadow-md">
        <h1 className="text-2xl font-extrabold mb-1">Financeiro</h1>
        <p className="text-sm text-slate-200">Acompanhe seus rendimentos na SR Logística.</p>
      </header>

      <main className="p-4 space-y-6 mt-4">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Card Hoje */}
          <Card className="p-5 flex items-center justify-between bg-[color:var(--surface)]/60 border-l-4 border-brand shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/6 text-brand-600 rounded-full">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-medium uppercase tracking-wide">Feito Hoje</p>
                <h2 className="text-2xl font-bold text-slate-100">R$ {ganhosHoje.toFixed(2)}</h2>
              </div>
            </div>
          </Card>

          {/* Card Mês */}
          <Card className="p-5 flex items-center justify-between bg-[color:var(--surface)]/60 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/6 text-green-400 rounded-full">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-medium uppercase tracking-wide">Feito no Mês</p>
                <h2 className="text-2xl font-bold text-slate-100">R$ {ganhosMes.toFixed(2)}</h2>
              </div>
            </div>
          </Card>

          {/* Card Líquido */}
          <Card className="p-6 flex items-center justify-between bg-gradient-to-r from-[#0B1224] to-[#071224] text-white shadow-lg border-none mt-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 text-white rounded-full">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium uppercase tracking-wide">Lucro Líquido</p>
                <h2 className="text-3xl font-extrabold text-green-400">R$ {liquidoMes.toFixed(2)}</h2>
              </div>
            </div>
          </Card>
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}