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
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
      : paymentMethod === 'card'
        ? 'bg-brand/15 text-brand-700 dark:text-brand border border-brand/30'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[color:var(--bg)] px-6 text-center text-slate-900 dark:text-slate-100 transition-colors">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <CheckCircle size={48} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Corrida finalizada!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ótimo trabalho, motorista.</p>
        </div>
        <div className="w-full max-w-xs rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-800 p-5 shadow-xl">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Resumo</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Valor final</span>
            <span className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              R$ {finishFeedback.valor}
            </span>
          </div>
          {finishFeedback.voucher && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-dark-700 pt-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Voucher</span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{finishFeedback.voucher}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push('/corridas')}
          className="w-full max-w-xs rounded-2xl bg-brand py-4 text-base font-black text-slate-950 shadow-lg shadow-brand/25 transition hover:bg-brand-hover active:scale-95"
        >
          Voltar às Corridas
        </button>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg)] px-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-xl font-bold">Corrida não encontrada</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma corrida ativa ou histórico disponível.</p>
          <button onClick={() => router.push('/corridas')} className="mt-4 rounded-2xl bg-brand px-6 py-2.5 font-bold text-slate-950 shadow-md">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)] text-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-dark-700 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
              Corrida #{String(rideId).slice(-6).toUpperCase()}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Clock size={11} />
              Em andamento
            </div>
          </div>
          {passengerRating != null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {typeof passengerRating === 'number' ? passengerRating.toFixed(1) : '--'}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4 pb-8">
        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-800 p-4 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Passageiro
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-slate-900 dark:text-white">{passengerName}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${paymentClass}`}>
                  {paymentLabel}
                </span>
              </div>
            </div>
            <a
              href="tel:+5592982329629"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-slate-950 font-bold shadow-lg shadow-brand/25 transition hover:bg-brand-hover active:scale-95"
            >
              <Phone size={18} />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-800 p-4 shadow-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Rota do Trajeto
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MapPin size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Origem / Embarque</div>
              <div className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{origin}</div>
            </div>
          </div>

          <div className="my-1.5 ml-4 h-5 border-l-2 border-dashed border-slate-300 dark:border-dark-600" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
              <Navigation size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Destino Final</div>
              <div className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{destination}</div>
            </div>
          </div>
        </div>

        {!activeRide && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-800 p-4 shadow-sm">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Observações Operacionais
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Convênio via licitação — voucher físico ou digital, assinado pelo gestor responsável. Enviar veículo em perfeito estado de conservação.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 p-4 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMessageModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-dark-700 bg-slate-100 dark:bg-dark-800 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-dark-700 active:scale-95 disabled:opacity-40"
          >
            <MessageCircle size={18} />
            Mensagem
          </button>
          <button
            onClick={() => setFinishModalOpen(true)}
            disabled={isRideFinished}
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600 active:scale-95 disabled:opacity-40"
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