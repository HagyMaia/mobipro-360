'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeAlert,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Luggage,
  MessageSquareWarning,
  Phone,
  ShieldAlert,
  Sparkles,
  UserX,
  Wrench,
  X,
} from 'lucide-react';
import { IncidentService } from '@/services/incident/IncidentService';
import { useAuth } from '@/lib/auth';
import type { IncidentReport, IncidentType } from '@/lib/types';
import { formatBRL } from '@/lib/utils';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId?: string;
  passengerName?: string;
  fareAmount?: number;
  onSubmitted?: (report: IncidentReport) => void;
}

const INCIDENT_CATEGORIES: {
  type: IncidentType;
  title: string;
  description: string;
  icon: any;
  color: string;
}[] = [
  {
    type: 'unpaid_fare',
    title: 'Passageiro não pagou',
    description: 'A corrida terminou sem o repasse do valor em dinheiro ou PIX.',
    icon: Banknote,
    color: 'text-red-500 bg-red-500/15',
  },
  {
    type: 'lost_item',
    title: 'Objeto esquecido no veículo',
    description: 'O passageiro esqueceu bolsa, celular, documento ou pertence.',
    icon: Luggage,
    color: 'text-amber-500 bg-amber-500/15',
  },
  {
    type: 'inappropriate_behavior',
    title: 'Conduta inadequada ou ofensiva',
    description: 'Desrespeito, agressividade verbal ou violação das regras.',
    icon: UserX,
    color: 'text-orange-500 bg-orange-500/15',
  },
  {
    type: 'vehicle_damage',
    title: 'Dano ou sujeira no carro',
    description: 'Derramamento de líquidos, avaria no estofado ou portas.',
    icon: Wrench,
    color: 'text-purple-500 bg-purple-500/15',
  },
  {
    type: 'safety_threat',
    title: 'Situação de risco / Ameaça',
    description: 'Tentativa de assalto, coação ou área de extremo perigo.',
    icon: ShieldAlert,
    color: 'text-rose-600 bg-rose-600/15',
  },
  {
    type: 'other',
    title: 'Outro problema',
    description: 'Divergência de rota, cobrança ou dúvida operacional.',
    icon: MessageSquareWarning,
    color: 'text-blue-500 bg-blue-500/15',
  },
];

export function ReportIncidentModal({
  isOpen,
  onClose,
  rideId,
  passengerName,
  fareAmount,
  onSubmitted,
}: ReportIncidentModalProps) {
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [unpaidAmount, setUnpaidAmount] = useState<string>(
    fareAmount ? String(fareAmount) : ''
  );
  const [itemDescription, setItemDescription] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);

  if (!isOpen) return null;

  const handleSelectCategory = (type: IncidentType) => {
    setSelectedType(type);
  };

  const handleBackToCategories = () => {
    setSelectedType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const report = await IncidentService.reportIncident({
        rideId: rideId || 'geral',
        driverId: user?.id,
        passengerName: passengerName || 'Passageiro',
        incidentType: selectedType,
        description: description.trim(),
        amountUnpaid: selectedType === 'unpaid_fare' ? Number(unpaidAmount || fareAmount || 0) : undefined,
        itemDescription: selectedType === 'lost_item' ? itemDescription.trim() : undefined,
        evidenceNotes: evidenceNotes.trim() || undefined,
      });

      setSubmittedReport(report);
      if (onSubmitted) {
        onSubmitted(report);
      }
    } catch (err) {
      console.error('[ReportIncidentModal] Erro ao registrar ocorrência:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setItemDescription('');
    setEvidenceNotes('');
    setSubmittedReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-2xl overflow-hidden">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
              <BadgeAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Central de Ocorrências
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Corrida #{String(rideId).slice(-6).toUpperCase()} · {passengerName || 'Passageiro'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {submittedReport ? (
            /* TELA DE SUCESSO / PROTOCOLO GERADO */
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Ocorrência Registrada
                </span>
                <h4 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  Protocolo: {submittedReport.protocolNumber}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Nossa equipe de suporte e segurança já recebeu os detalhes. Você será notificado sobre o andamento do caso.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/60 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Status:</span>
                  <strong className="text-amber-500">Em Análise pela Central</strong>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Prazo de Retorno:</span>
                  <strong className="text-slate-900 dark:text-white">Até 24 horas úteis</strong>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Data/Hora:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {new Date(submittedReport.createdAt).toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href="tel:+5592982329629"
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200"
                >
                  <Phone size={14} /> Falar com Plantão
                </a>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-2xl bg-brand py-3 text-xs font-black text-slate-950 shadow-md shadow-brand/20 hover:brightness-105"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : !selectedType ? (
            /* SELEÇÃO DE CATEGORIA */
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Selecione o motivo da ocorrência para darmos prioridade no atendimento:
              </p>

              <div className="grid gap-2.5">
                {INCIDENT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => handleSelectCategory(cat.type)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50/70 dark:bg-dark-800/60 p-3.5 text-left transition hover:border-brand hover:bg-slate-100 dark:hover:bg-dark-800 active:scale-99 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${cat.color}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {cat.title}
                          </div>
                          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {cat.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-brand" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE DETALHES */
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="text-xs font-bold text-brand-600 dark:text-brand flex items-center gap-1 hover:underline mb-1"
              >
                ← Escolher outro motivo
              </button>

              {/* Categoria Ativa */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/40 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand-700 dark:text-brand">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Motivo Selecionado</div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {INCIDENT_CATEGORIES.find((c) => c.type === selectedType)?.title}
                  </div>
                </div>
              </div>

              {/* Campo Específico se for Não Pagamento */}
              {selectedType === 'unpaid_fare' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Não Pago pelo Passageiro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unpaidAmount}
                    onChange={(e) => setUnpaidAmount(e.target.value)}
                    placeholder="Ex: 25.50"
                    className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-brand focus:outline-none"
                  />
                </div>
              )}

              {/* Campo Específico se for Objeto Esquecido */}
              {selectedType === 'lost_item' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Objeto Encontrado
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ex: Bolsa feminina preta com documentos"
                    className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-brand focus:outline-none"
                  />
                </div>
              )}

              {/* Descrição Detalhada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Relato do Ocorrido <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que aconteceu em detalhes para facilitar a resolução pela nossa central..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand focus:outline-none"
                />
              </div>

              {/* Observações Adicionais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações adicionais / Evidências (Opcional)
                </label>
                <input
                  type="text"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Ex: Tenho fotos do banco ou gravação de áudio no painel"
                  className="w-full rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand focus:outline-none"
                />
              </div>

              {/* BOTÕES DE ENVIO */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-dark-700 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-xs font-black text-white shadow-lg shadow-red-600/25 hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Registrar Ocorrência
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
