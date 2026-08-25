'use client';

import { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Target,
  Wallet,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { ExpenseForm, ExpenseItem } from '@/components/ExpenseComponents';
import { Badge, Button, Card, ProgressBar, SectionTitle, Stat } from '@/components/ui';
import { useApp } from '@/lib/store';
import { formatBRL, isToday } from '@/lib/utils';

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export default function FinanceiroPage() {
  const { state, dispatch, todayEarnings, todayExpenses, todayNet, goalProgress } = useApp();
  const [goalInput, setGoalInput] = useState(String(state.goalTarget));
  const [editingGoal, setEditingGoal] = useState(false);

  const todayExpensesList = state.expenses.filter((e) => isToday(e.date));
  const todayEarningsList = state.earnings.filter((e) => isToday(e.date));

  const todayRidesCount = state.rideHistory.filter(
    (r) => r.completedAt && isToday(r.completedAt)
  ).length;

  function saveGoal() {
    const value = parseFloat(goalInput.replace(',', '.'));
    if (value > 0) dispatch({ type: 'SET_GOAL', target: value });
    setEditingGoal(false);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-800/95 px-4 pb-3 pt-4 backdrop-blur-md shadow-lg">
        <h1 className="text-xl font-extrabold text-slate-50">
          Financeiro <span className="text-brand-400">diário</span>
        </h1>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <div className="space-y-4 p-4 pb-28">
        {/* Card principal: lucro líquido */}
        <Card className="bg-gradient-to-br from-brand-800/40 to-dark-800 ring-1 ring-brand-500/20">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Lucro líquido do dia</span>
            <Badge className="bg-success/15 text-success">
              {todayRidesCount} corrida{todayRidesCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div
            className={`text-4xl font-extrabold tabular-nums transition-all ${
              todayNet >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {formatBRL(todayNet)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-success/10 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle size={13} className="text-success" />
                <span className="text-xs text-slate-400">Ganhos</span>
              </div>
              <Stat label="" value={formatBRL(todayEarnings)} accent="text-success" />
            </div>
            <div className="rounded-xl bg-danger/10 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <ArrowDownCircle size={13} className="text-danger" />
                <span className="text-xs text-slate-400">Despesas</span>
              </div>
              <Stat label="" value={formatBRL(todayExpenses)} accent="text-danger" />
            </div>
          </div>
        </Card>

        {/* Meta do dia */}
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <Target size={15} className="text-brand-400" />
              Meta do dia
            </span>
            {editingGoal ? (
              <div className="flex items-center gap-1.5">
                <input
                  inputMode="decimal"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-20 rounded-lg border border-brand-500 bg-dark-800 px-2 py-1 text-right text-sm text-slate-100 outline-none focus:ring-1 focus:ring-brand-400"
                />
                <Button size="sm" onClick={saveGoal}>
                  OK
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="flex items-center gap-1 text-sm font-bold tabular-nums text-brand-300 hover:underline"
              >
                {formatBRL(state.goalTarget)}
              </button>
            )}
          </div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>{formatBRL(todayEarnings)} ganhos</span>
            <span>{Math.round(goalProgress * 100)}%</span>
          </div>
          <ProgressBar
            value={goalProgress}
            barClassName={
              goalProgress >= 1
                ? 'bg-gradient-to-r from-success to-emerald-400'
                : 'bg-gradient-to-r from-brand-500 to-success'
            }
          />
          {goalProgress >= 1 && (
            <div className="mt-3 rounded-xl bg-success/15 px-3 py-2.5 text-center text-sm font-semibold text-success">
              🏆 Meta batida! Ótimo trabalho.
            </div>
          )}
        </Card>

        {/* Ganhos */}
        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <ArrowUpCircle size={14} className="text-success" />
            Ganhos de hoje
          </SectionTitle>
          {todayEarningsList.length === 0 ? (
            <Card className="py-6 text-center">
              <Wallet size={20} className="mx-auto mb-1 text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum ganho registrado ainda.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayEarningsList.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-dark-700/60 px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <ArrowUpCircle size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-200">{e.note}</div>
                    <div className="text-[11px] text-slate-500">
                      Corrida · {formatTime(e.date)}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold tabular-nums text-success">
                    +{e.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Despesas */}
        <div>
          <SectionTitle className="mb-2 flex items-center gap-1.5">
            <ArrowDownCircle size={14} className="text-danger" />
            Despesas de hoje
          </SectionTitle>
          <ExpenseForm onAdd={(expense) => dispatch({ type: 'ADD_EXPENSE', expense })} />
          <div className="mt-2 space-y-2">
            {todayExpensesList.length === 0 ? (
              <Card className="py-6 text-center text-sm text-slate-500">
                Nenhuma despesa registrada hoje.
              </Card>
            ) : (
              todayExpensesList.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  onRemove={(id) => dispatch({ type: 'REMOVE_EXPENSE', id })}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
