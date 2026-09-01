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

  const activeRide = state?.activeRide ?? null;
  const fallbackRide = (Array.isArray(state?.rideHistory) && state.rideHistory.length > 0)
    ? state.rideHistory[state.rideHistory.length - 1]
    : null;
  const ride = activeRide ?? fallbackRide ?? null;

  const passengerName = String(ride?.passengerName ?? 'Passageiro');
  const origin = String(ride?.pickup ?? '—');
  const destination = String(ride?.dropoff ?? '—');
  const paymentMethod = String(ride?.paymentMethod ?? '');
  const passengerRating = typeof ride?.passengerRating === 'number' ? ride?.passengerRating : null;
  const rideId = ride?.id ?? '—';

  const paymentLabel = paymentMethod === 'cash' ? 'Dinheiro' : paymentMethod === 'card' ? 'Cartão' : paymentMethod === 'pix' ? 'Pix' : '—';

  const paymentClass =
    paymentMethod === 'cash'
      ? 'bg-emerald-500/15 text-emerald-300'
      : paymentMethod === 'card'
        ? 'bg-brand-500/15 text-brand-300'
        : 'bg-amber-500/15 text-amber-300';

  const handleSendMessage = (msg: string) => {
    console.log('Mensagem selecionada:', msg);
    setMessageModalOpen(false);
  };

  const handleFinishConfirm = (valor: string, voucher: string) => {
    setFinishModalOpen(false);
    setRideFinished(true);
    setFinishFeedback({ valor, voucher });
  };

  if (isRideFinished && finishFeedback) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dark-900 px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle size={48} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--text)] dark:text-white">Corrida finalizada!</h2>
          <p className="mt-1 text-slate-400">Ótimo trabalho, motorista.</p>
        </div>
        <div className="w-full max-w-xs rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-xl shadow-black/10">
          <div className="mb-3 text-xs uppercase tracking-widest text-slate-500">Resumo</div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Valor final</span>
            <span className="text-xl font-extrabold tabular-nums text-emerald-400">
              R$ {finishFeedback.valor}
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
          className="w-full max-w-xs rounded-2xl bg-brand-600 py-4 text-base font-bold text-[color:var(--text)] dark:text-white transition hover:bg-brand-500 active:scale-95"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 text-slate-200">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-xl font-bold">Corrida não encontrada</h2>
          <p className="text-sm text-slate-400">Nenhuma corrida ativa ou histórico disponível.</p>
          <button onClick={() => router.push('/')} className="mt-4 rounded-2xl bg-brand-600 px-4 py-2 font-bold text-[color:var(--text)] dark:text-white">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-900 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-800 text-slate-300 transition hover:bg-dark-700 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">
              Corrida #{String(rideId).slice(-6).toUpperCase()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock size={10} />
              Em andamento
            </div>
          </div>
          {passengerRating != null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
              <Star size={11} />
              {typeof passengerRating === 'number' ? passengerRating.toFixed(1) : '--'}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-8">
        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-lg shadow-black/10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Passageiro
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-[color:var(--text)] dark:text-white">{passengerName}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${paymentClass}`}>
                  {paymentLabel}
                </span>
                {typeof passengerRating === 'number' ? (
                  <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
                    <Star size={10} />
                    {passengerRating.toFixed(1)}
                  </span>
                ) : null}
              </div>
            </div>
            <a
              href="tel:+5592982329629"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[color:var(--text)] dark:text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500 active:scale-95"
            >
              <Phone size={18} />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-lg shadow-black/10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rota
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <MapPin size={15} className="text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">Origem</div>
              <div className="text-sm font-medium leading-snug text-slate-200">{origin}</div>
            </div>
          </div>

          <div className="my-1 ml-4 h-5 border-l-2 border-dashed border-dark-600" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <Navigation size={15} className="text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500">Destino</div>
              <div className="text-sm font-medium leading-snug text-slate-200">{destination}</div>
            </div>
          </div>
        </div>

        {!activeRide && (
          <div className="rounded-2xl border border-dark-700 bg-dark-800 p-4 shadow-lg shadow-black/10">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Observações
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Convênio via licitação — boleto impresso, carimbado e assinado pela gestora Sra. Luciana Souza.
              Enviar veículo em bom estado de conservação.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-dark-700 bg-dark-900/95 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMessageModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl bg-dark-800 py-4 text-sm font-bold text-slate-200 transition hover:bg-dark-700 active:scale-95 disabled:opacity-40"
          >
            <MessageCircle size={18} />
            Mensagem
          </button>
          <button
            onClick={() => setFinishModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 text-sm font-bold text-[color:var(--text)] dark:text-white shadow-lg shadow-red-900/30 transition hover:bg-red-400 active:scale-95 disabled:opacity-40"
          >
            <XCircle size={18} />
            Finalizar
          </button>
        </div>
      </footer>

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