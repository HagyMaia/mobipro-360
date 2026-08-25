'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  XCircle,
} from 'lucide-react';
import { QuickMessagesModal } from '@/components/Ride/QuickMessagesModal';
import { FinishRideModal } from '@/components/Ride/FinishRideModal';
import { useApp } from '@/lib/store';

export default function DetalheCorrida() {
  const router = useRouter();
  const { state } = useApp();

  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [isFinishModalOpen, setFinishModalOpen] = useState(false);
  const [isRideFinished, setRideFinished] = useState(false);
  const [finishFeedback, setFinishFeedback] = useState<{ valor: string; voucher: string } | null>(null);

  // Tenta usar corrida ativa; fallback para histórico mais recente
  const activeRide = state.activeRide;
  const fallbackRide = state.rideHistory[state.rideHistory.length - 1];
  const ride = activeRide ?? fallbackRide;

  const passengerName = ride?.passengerName ?? 'Passageiro';
  const origin = ride?.pickup ?? '—';
  const destination = ride?.dropoff ?? '—';
  const paymentMethod = ride?.paymentMethod;
  const passengerRating = ride?.passengerRating;
  const rideId = ride?.id ?? '—';

  const paymentLabel =
    paymentMethod === 'cash'
      ? 'Dinheiro'
      : paymentMethod === 'card'
        ? 'Cartão'
        : paymentMethod === 'pix'
          ? 'Pix'
          : '—';

  const paymentClass =
    paymentMethod === 'cash'
      ? 'bg-success/15 text-success'
      : paymentMethod === 'card'
        ? 'bg-brand-500/15 text-brand-300'
        : 'bg-warn/15 text-warn';

  const handleSendMessage = (msg: string) => {
    console.log('Mensagem selecionada:', msg);
    setMessageModalOpen(false);
  };

  const handleFinishConfirm = (valor: string, voucher: string) => {
    console.log('Corrida finalizada! Valor:', valor, 'Voucher:', voucher);
    setFinishModalOpen(false);
    setRideFinished(true);
    setFinishFeedback({ valor, voucher });
  };

  // Tela de sucesso após finalizar
  if (isRideFinished && finishFeedback) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dark-900 px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/20">
          <CheckCircle size={48} className="text-success" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-50">Corrida finalizada!</h2>
          <p className="mt-1 text-slate-400">Ótimo trabalho, motorista.</p>
        </div>
        <div className="w-full max-w-xs rounded-2xl bg-dark-800 p-5 ring-1 ring-dark-600">
          <div className="mb-3 text-xs uppercase tracking-widest text-slate-500">Resumo</div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Valor final</span>
            <span className="text-xl font-extrabold tabular-nums text-success">
              R\$ {finishFeedback.valor}
            </span>
          </div>
          {finishFeedback.voucher && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-400">Voucher</span>
              <span className="font-mono text-sm text-slate-200">{finishFeedback.voucher}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-xs rounded-2xl bg-brand-600 py-4 text-base font-bold text-white transition active:scale-95"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-800/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-700 text-slate-300 transition hover:bg-dark-600 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-100">
              Corrida #{String(rideId).slice(-6).toUpperCase()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock size={10} />
              Em andamento
            </div>
          </div>
          {passengerRating && (
            <div className="flex items-center gap-1 rounded-full bg-warn/15 px-2 py-1 text-xs font-semibold text-warn">
              <Star size={11} />
              {passengerRating.toFixed(1)}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-8">

        {/* Passageiro */}
        <div className="rounded-2xl bg-dark-800 p-4 ring-1 ring-dark-600">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Passageiro
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-slate-100">{passengerName}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${paymentClass}`}
                >
                  {paymentLabel}
                </span>
                {passengerRating && (
                  <span className="flex items-center gap-0.5 text-[11px] text-warn">
                    <Star size={10} />
                    {passengerRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <a
              href="tel:+5592982329629"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700 active:scale-95"
            >
              <Phone size={18} />
            </a>
          </div>
        </div>

        {/* Rota */}
        <div className="rounded-2xl bg-dark-800 p-4 ring-1 ring-dark-600">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rota
          </div>

          {/* Origem */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15">
              <MapPin size={15} className="text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">Origem</div>
              <div className="text-sm font-medium text-slate-200 leading-snug">{origin}</div>
            </div>
          </div>

          {/* Linha divisória */}
          <div className="ml-4 my-1 border-l-2 border-dashed border-dark-600 h-5" />

          {/* Destino */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/15">
              <Navigation size={15} className="text-danger" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">Destino</div>
              <div className="text-sm font-medium text-slate-200 leading-snug">{destination}</div>
            </div>
          </div>
        </div>

        {/* Observações — se não há dados reais, oculta */}
        {!activeRide && (
          <div className="rounded-2xl bg-dark-800 p-4 ring-1 ring-dark-600">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Observações
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convênio via licitação — boleto impresso, carimbado e assinado pela gestora Sra. Luciana Souza.
              Enviar veículo em bom estado de conservação.
            </p>
          </div>
        )}
      </main>

      {/* Footer — botões de ação */}
      <footer className="border-t border-dark-700 bg-dark-800/95 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMessageModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl bg-dark-700 py-4 text-sm font-bold text-slate-200 transition hover:bg-dark-600 active:scale-95 disabled:opacity-40"
          >
            <MessageCircle size={18} />
            Mensagem
          </button>
          <button
            onClick={() => setFinishModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl bg-danger py-4 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95 disabled:opacity-40"
          >
            <XCircle size={18} />
            Finalizar
          </button>
        </div>
      </footer>

      {/* Modais */}
      <QuickMessagesModal
        isOpen={isMessageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        onSendMessage={handleSendMessage}
      />
      <FinishRideModal
        isOpen={isFinishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        onConfirm={handleFinishConfirm}
      />
    </div>
  );
}