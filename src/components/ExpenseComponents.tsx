'use client';

import { useState } from 'react';
import { Beef, CarFront, Fuel, Plus, SprayCan, Wrench, X } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { uid } from '@/lib/utils';
import { Button, Card, Field, inputClass } from '@/components/ui';

const CATEGORIES: Array<{ key: ExpenseCategory; label: string; icon: typeof Fuel }> = [
  { key: 'combustivel', label: 'Combustivel', icon: Fuel },
  { key: 'alimentacao', label: 'Alimentacao', icon: Beef },
  { key: 'lavagem', label: 'Lavagem', icon: SprayCan },
  { key: 'manutencao', label: 'Manutencao', icon: Wrench },
  { key: 'outros', label: 'Outros', icon: CarFront }
];

export function ExpenseForm({ onAdd }: { onAdd: (e: Expense) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [note, setNote] = useState('');

  function submit() {
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    onAdd({
      id: uid('exp'),
      amount: value,
      category,
      note: note.trim() || CATEGORIES.find((c) => c.key === category)?.label || category,
      date: new Date().toISOString().slice(0, 10)
    });
    setAmount('');
    setNote('');
    setOpen(false);
  }

  return (
    <div>
      {open ? (
        <Card className="border-brand-500/30">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100">Nova despesa</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-5 gap-1.5">
            {CATEGORIES.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition ${
                  category === key
                    ? 'border-brand-500 bg-brand-600/20 text-brand-600'
                    : 'border-dark-700 text-slate-400 hover:border-dark-600'
                }`}
              >
                <Icon size={16} />
                {CATEGORIES.find((c) => c.key === key)?.label.slice(0, 8)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valor (R$)">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50,00"
                className={inputClass()}
              />
            </Field>
            <Field label="Descricao">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Abastecimento"
                className={inputClass()}
              />
            </Field>
          </div>
          <Button full className="mt-3" onClick={submit}>
            Adicionar despesa
          </Button>
        </Card>
      ) : (
        <Button variant="outline" full onClick={() => setOpen(true)}>
          <Plus size={16} /> Registrar despesa
        </Button>
      )}
    </div>
  );
}

export function ExpenseItem({
  expense,
  onRemove
}: {
  expense: Expense;
  onRemove: (id: string) => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === expense.category) ?? CATEGORIES[4];
  const Icon = cat.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-dark-700/50 px-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warn/15 text-warn">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-slate-200">{expense.note}</div>
        <div className="text-[11px] text-slate-500">{cat.label}</div>
      </div>
      <div className="text-sm font-semibold tabular-nums text-danger">
        -{(expense.amount ?? 0).toFixed(2)}
      </div>
      <button
        onClick={() => onRemove(expense.id)}
        className="rounded-full p-1 text-slate-600 hover:text-slate-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}

