import {
  CheckCircle2,
  Navigation,
  RotateCcw,
} from "lucide-react";

import { TripOfferCard } from "./components/TripOfferCard";

import type { Trip } from "./domain/trip.types";

import { useTripStore } from "./store/useTripStore";

const demoTrip: Trip = {
  id: "trip-demo-001",

  status: "SEARCHING_DRIVER",

  passengerName: "Passageiro",

  origin: {
    latitude: -23.55052,
    longitude: -46.633308,
    address: "Rua das Flores, 120",
    neighborhood: "Centro",
    city: "São Paulo",
  },

  destination: {
    latitude: -23.5581,
    longitude: -46.6396,
    address: "Avenida Central, 900",
    neighborhood: "Região Norte",
    city: "São Paulo",
  },

  paymentMethod: "PIX",

  estimatedDistanceMeters: 8400,

  estimatedDurationSeconds: 900,

  estimatedFare: 28.5,

  requestedAt: new Date().toISOString(),
};

function getTripStatusLabel(status: Trip["status"]): string {
  const labels = {
    SEARCHING_DRIVER: "Aguardando motorista",
    DRIVER_ASSIGNED: "Corrida aceita",
    DRIVER_ARRIVING: "A caminho do passageiro",
    DRIVER_ARRIVED: "Motorista chegou ao embarque",
    IN_PROGRESS: "Corrida em andamento",
    COMPLETED: "Corrida finalizada",
  };

  return labels[status];
}

export function TripFlowTest() {
  const {
    currentTrip,
    setCurrentTrip,
    changeTripStatus,
    clearTrip,
  } = useTripStore();

  function handleAcceptTrip() {
    setCurrentTrip({
      ...demoTrip,
      status: "DRIVER_ASSIGNED",
      driverAssignedAt: new Date().toISOString(),
    });
  }

  function handleRejectTrip() {
    window.alert(
      "Corrida recusada. Em um sistema real, a SR Logística procurará outro motorista.",
    );
  }

  function handleNextStep() {
    if (!currentTrip) {
      return;
    }

    const nextStatusByCurrentStatus = {
      DRIVER_ASSIGNED: "DRIVER_ARRIVING",
      DRIVER_ARRIVING: "DRIVER_ARRIVED",
      DRIVER_ARRIVED: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
    } as const;

    const nextStatus =
      nextStatusByCurrentStatus[
        currentTrip.status as keyof typeof nextStatusByCurrentStatus
      ];

    if (nextStatus) {
      changeTripStatus(nextStatus);
    }
  }

  function getNextButtonLabel(): string | null {
    if (!currentTrip) {
      return null;
    }

    const labels = {
      DRIVER_ASSIGNED: "Iniciar deslocamento",
      DRIVER_ARRIVING: "Confirmar chegada",
      DRIVER_ARRIVED: "Iniciar corrida",
      IN_PROGRESS: "Finalizar corrida",
    };

    return (
      labels[
        currentTrip.status as keyof typeof labels
      ] ?? null
    );
  }

  const nextButtonLabel = getNextButtonLabel();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">
            SR Logística
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Teste de Corrida
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Ambiente temporário para validar o fluxo do motorista.
          </p>
        </header>

        {!currentTrip && (
          <TripOfferCard
            trip={demoTrip}
            onAccept={handleAcceptTrip}
            onReject={handleRejectTrip}
          />
        )}

        {currentTrip && (
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Navigation size={21} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-400">
                  Corrida ativa
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {getTripStatusLabel(
                    currentTrip.status,
                  )}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Passageiro:{" "}
                  <strong>
                    {currentTrip.passengerName}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Status técnico
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-white">
                {currentTrip.status}
              </p>
            </div>

            {nextButtonLabel && (
              <button
                type="button"
                onClick={handleNextStep}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-black text-white shadow-lg shadow-brand/25 transition active:scale-95"
              >
                <Navigation size={19} />
                {nextButtonLabel}
              </button>
            )}

            {currentTrip.status === "COMPLETED" && (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <CheckCircle2
                  size={28}
                  className="mx-auto text-emerald-400"
                />

                <h3 className="mt-2 font-black text-emerald-400">
                  Corrida finalizada com sucesso
                </h3>

                <p className="mt-1 text-sm text-slate-300">
                  Depois criaremos a tela de ganho, taxa da
                  plataforma e confirmação de pagamento.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={clearTrip}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 font-black text-red-400 transition active:scale-95"
            >
              <RotateCcw size={18} />
              Reiniciar teste
            </button>
          </section>
        )}
      </div>
    </main>
  );
}