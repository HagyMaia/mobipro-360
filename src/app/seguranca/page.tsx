'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  MessageSquareText,
  Phone,
  Plus,
  ShieldAlert,
  Star,
  Trash2,
  UserCheck,
  Video,
  X
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge, Button, Card, Field, SectionTitle, inputClass } from '@/components/ui';
import { useApp } from '@/lib/store';
import type { EmergencyContact } from '@/lib/types';
import { uid } from '@/lib/utils';

export default function SegurancaPage() {
  const { state, dispatch } = useApp();
  const [panicOpen, setPanicOpen] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('');

  function addContact() {
    if (!contactName.trim() || !contactPhone.trim()) return;
    const c: EmergencyContact = {
      id: uid('ctc'),
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRel.trim() || 'Contato'
    };
    dispatch({ type: 'ADD_CONTACT', contact: c });
    setContactName('');
    setContactPhone('');
    setContactRel('');
    setAddingContact(false);
  }

  function triggerPanic() {
    setPanicOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-slate-50">
          Seguranca <span className="text-brand-400">ativa</span>
        </h1>
        <p className="text-xs text-slate-400">Protecao durante o trabalho diario</p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="flex flex-col items-center border-danger/40 py-6 text-center">
          <button
            onClick={triggerPanic}
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-danger/60 bg-danger/20 transition active:scale-95"
            aria-label="Botao de panico"
          >
            <span className="flex flex-col items-center gap-1 text-danger">
              <ShieldAlert size={40} />
              <span className="text-[11px] font-extrabold uppercase">Panico</span>
            </span>
          </button>
          <p className="mt-4 max-w-[280px] text-xs text-slate-400">
            Em emergencia, pressione o botao acima ou pressione o botao de volume do celular 3 vezes
            rapidamente. Sua localizacao em tempo real sera enviada aos contatos de emergencia.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge className="bg-brand-600/20 text-brand-300">
              <Video size={11} /> Camera ativa em corrida
            </Badge>
            <Badge className="bg-success/15 text-success">
              <UserCheck size={11} /> Filtro de passageiro ON
            </Badge>
          </div>
        </Card>

        <div>
          <SectionTitle className="mb-2">Contatos de emergencia</SectionTitle>
          <div className="space-y-2">
            {state.contacts.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20 text-brand-300">
                  <Phone size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-200">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    {c.relationship} · {c.phone}
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_CONTACT', id: c.id })}
                  className="rounded-full p-2 text-slate-600 transition hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>

          {addingContact ? (
            <Card className="mt-2 border-brand-500/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">Novo contato</span>
                <button
                  onClick={() => setAddingContact(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <Field label="Nome">
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Maria Silva"
                    className={inputClass()}
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className={inputClass()}
                  />
                </Field>
                <Field label="Parentesco">
                  <input
                    value={contactRel}
                    onChange={(e) => setContactRel(e.target.value)}
                    placeholder="Familia, amigo..."
                    className={inputClass()}
                  />
                </Field>
                <Button full className="mt-1" onClick={addContact}>
                  Salvar contato
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" full className="mt-2" onClick={() => setAddingContact(true)}>
              <Plus size={16} /> Adicionar contato
            </Button>
          )}
        </div>

        <div>
          <SectionTitle className="mb-2">Filtro de passageiros</SectionTitle>
          <Card className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Star size={14} className="text-warn" /> Nota minima
                </span>
                <span className="font-bold tabular-nums text-slate-100">
                  {state.filters.minRating.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="5"
                step="0.1"
                value={state.filters.minRating}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_FILTERS',
                    filters: { ...state.filters, minRating: parseFloat(e.target.value) }
                  })
                }
                className="w-full accent-warn"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <UserCheck size={14} className="text-brand-400" /> Tempo minimo de conta
                </span>
                <span className="font-bold tabular-nums text-slate-100">
                  {state.filters.minAccountMonths} mes(es)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={state.filters.minAccountMonths}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_FILTERS',
                    filters: { ...state.filters, minAccountMonths: parseInt(e.target.value) }
                  })
                }
                className="w-full accent-brand-500"
              />
            </div>

            {(['rejectCash', 'autoReject'] as const).map((key) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm text-slate-200">
                  {key === 'rejectCash' ? (
                    <MessageSquareText size={14} className="text-slate-400" />
                  ) : (
                    <AlertTriangle size={14} className="text-danger" />
                  )}
                  {key === 'rejectCash'
                    ? 'Recusar passageiros que pagam em dinheiro'
                    : 'Recusa automatica de perfis suspeitos'}
                </span>
                <button
                  role="switch"
                  aria-checked={state.filters[key]}
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_FILTERS',
                      filters: { ...state.filters, [key]: !state.filters[key] }
                    })
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    state.filters[key] ? 'bg-success' : 'bg-dark-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      state.filters[key] ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </Card>
        </div>
      </div>

      {panicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm border-danger/50 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-danger/20">
              <AlertTriangle size={28} className="text-danger" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-50">Alerta de emergencia</h2>
            <p className="mt-1 text-sm text-slate-300">
              Sua localizacao em tempo real esta sendo enviada para:
            </p>
            <div className="mt-3 space-y-2">
              {state.contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl bg-dark-700/60 px-3 py-2 text-left"
                >
                  <MessageSquareText size={15} className="shrink-0 text-brand-400" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-200">{c.name}</div>
                    <div className="truncate text-[11px] text-slate-400">
                      {c.phone} · SMS + GPS ativo
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="danger" size="lg" full onClick={() => setPanicOpen(false)}>
                Enviado! Fechar alerta
              </Button>
              <Button variant="outline" size="sm" full onClick={() => setPanicOpen(false)}>
                Cancelar (falso alarme)
              </Button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </>
  );
}
