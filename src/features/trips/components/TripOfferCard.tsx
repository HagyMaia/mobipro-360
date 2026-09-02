import {
  Clock3,
  MapPin,
  Navigation,
  Wallet,
} from "lucide-react";

import type { Trip } from "../domain/trip.types";

interface TripOfferCardProps {
  trip: Trip;

  onAccept: () => void;

  onReject: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDistance(meters: number): string {
  const kilometers = meters / 1000;

  return `${kilometers.toFixed(1).replace(".", ",")} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(
    1,
    Math.round(seconds / 60),
  );

  return `${minutes} min`;
}

function getPaymentMethodLabel(
  paymentMethod: Trip["paymentMethod"],
): string {
  const labels = {
    CASH: "Dinheiro",
    PIX: "PIX",
    CREDIT_CARD: "Cartão",
  };

  return labels[paymentMethod];
}

export function TripOfferCard({
  trip,
  onAccept,
  onReject,
}: TripOfferCardProps) {
  return (
    <section className="w-full rounded-3xl border border-white/10 bg-[color:var(--surface)] p-5 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            Nova corrida
          </p>

          <h1 className="mt-1 text-xl font-black text-[color:var(--text)] dark:text-white">
            Passageiro aguardando
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Analise os dados e aceite a corrida.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <Clock3 size={21} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/5 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={17} className="text-brand" />

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Embarque
            </span>
          </div>

          <p className="font-bold text-[color:var(--text)] dark:text-white">
            {trip.origin.address}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {trip.origin.neighborhood}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/5 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2">
            <Navigation size={17} className="text-brand" />

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Destino
            </span>
          </div>

          <p className="font-bold text-[color:var(--text)] dark:text-white">
            {trip.destination.neighborhood}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Destino aproximado
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Distância
            </span>

            <strong className="mt-1 block text-lg text-[color:var(--text)] dark:text-white">
              {formatDistance(
                trip.estimatedDistanceMeters,
              )}
            </strong>
          </div>

          <div className="rounded-2xl border border-white/10 p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Tempo
            </span>

            <strong className="mt-1 block text-lg text-[color:var(--text)] dark:text-white">
              {formatDuration(
                trip.estimatedDurationSeconds,
              )}
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/10 p-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-brand">
              Ganho estimado
            </span>

            <strong className="mt-1 block text-2xl font-black text-[color:var(--text)] dark:text-white">
              {formatCurrency(
                trip.estimatedFare,
              )}
            </strong>
          </div>

          <Wallet size={28} className="text-brand" />
        </div>

        <p className="text-sm text-slate-400">
          Pagamento:{" "}
          <strong className="text-[color:var(--text)] dark:text-white">
            {getPaymentMethodLabel(
              trip.paymentMethod,
            )}
          </strong>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          className="h-14 rounded-2xl border border-red-500/30 bg-red-500/10 font-black text-red-500 transition active:scale-95"
        >
          Recusar
        </button>

        <button
          type="button"
          onClick={onAccept}
          className="h-14 rounded-2xl bg-brand font-black text-white shadow-lg shadow-brand/25 transition active:scale-95"
        >
          Aceitar
        </button>
      </div>
    </section>
  );
}