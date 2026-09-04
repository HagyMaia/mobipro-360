'use client';

import {
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { TripOfferCard } from "./components/TripOfferCard";

import type { Trip } from "./domain/trip.types";

import { useTripStore } from "./store/useTripStore";

const demoTrip: Trip = {
  id: "trip-demo-001",
  status: "SEARCHING_DRIVER",
  passengerName: "Ana Souza",
  origin: {
    latitude: -3.1090,
    longitude: -60.0150,
    address: "Av. Djalma Batista, 1000",
    neighborhood: "Adrianópolis / Chapada",
    city: "Manaus",
  },

  destination: {
    latitude: -3.0863,
    longitude: -60.0789,
    address: "Av. Coronel Teixeira, 1320",
    neighborhood: "Ponta Negra",
    city: "Manaus",
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_35%),linear-gradient(180deg,_#0b1220_0%,_#111827_100%)] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-300">
                SR Logística
              </p>
              <h1 className="mt-2 text-2xl font-black text-white">Fluxo de corrida</h1>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              Operação ativa
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <Wallet size={12} className="text-brand-300" /> Valor
              </div>
              <div className="mt-2 text-xl font-black text-white">R$ 28,50</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <Clock3 size={12} className="text-brand-300" /> Tempo
              </div>
              <div className="mt-2 text-xl font-black text-white">15 min</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <ShieldCheck size={12} className="text-brand-300" /> Status
              </div>
              <div className="mt-2 text-sm font-bold text-emerald-300">Seguro ativo</div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {!currentTrip && (
              <TripOfferCard
                trip={demoTrip}
                onAccept={handleAcceptTrip}
                onReject={handleRejectTrip}
              />
            )}

            {currentTrip && (
              <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-2xl shadow-emerald-950/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                    <Navigation size={22} />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
                      Corrida ativa
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-white">
                      {getTripStatusLabel(currentTrip.status)}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      Passageiro: <strong className="text-white">{currentTrip.passengerName}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <MapPin size={12} className="text-emerald-300" /> Rota
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>Embarque</span>
                    <span className="font-semibold text-white">{currentTrip.origin.address}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>Destino</span>
                    <span className="font-semibold text-white">{currentTrip.destination.neighborhood}</span>
                  </div>
                </div>

                {nextButtonLabel && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-black text-slate-950 shadow-lg shadow-brand/25 transition active:scale-95"
                  >
                    <Navigation size={18} />
                    {nextButtonLabel}
                  </button>
                )}

                {currentTrip.status === "COMPLETED" && (
                  <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <CheckCircle2 size={30} className="mx-auto text-emerald-300" />
                    <h3 className="mt-2 text-lg font-black text-emerald-300">Corrida finalizada com sucesso</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      A confirmação de pagamento e as métricas do motorista podem ser exibidas em seguida.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearTrip}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 font-black text-red-300 transition active:scale-95"
                >
                  <RotateCcw size={18} />
                  Reiniciar teste
                </button>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Progresso da viagem
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Motorista designado', active: true },
                  { label: 'Chegada ao embarque', active: true },
                  { label: 'Início da corrida', active: false },
                  { label: 'Finalização', active: false },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${step.active ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className={`text-sm ${step.active ? 'text-white font-semibold' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Dados do passageiro
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-lg font-black text-brand-300">
                  A
                </div>
                <div>
                  <div className="font-bold text-white">Ana Souza</div>
                  <div className="text-sm text-slate-400">Cliente Gold</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Pagamento</span>
                  <span className="font-semibold text-white">PIX</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Distância</span>
                  <span className="font-semibold text-white">8,4 km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ganho estimado</span>
                  <span className="font-semibold text-emerald-300">R$ 28,50</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}