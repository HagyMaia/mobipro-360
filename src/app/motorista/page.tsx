import { TripOfferCard } from "@/features/trips/components/TripOfferCard";
import { useTripStore } from "@/features/trips/store/useTripStore";
import type { Trip } from "@/features/trips/domain/trip.types";

export default function MotoristaPage() {
  const currentTrip = useTripStore((state) => state.currentTrip);

  if (!currentTrip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070D18] px-6 text-center text-slate-200">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Motorista</p>
          <h1 className="mt-3 text-2xl font-black text-white">Nenhuma corrida ativa</h1>
          <p className="mt-2 text-sm text-slate-400">
            Aguarde uma nova solicitação para visualizar os detalhes da viagem.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070D18] px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <TripOfferCard
          trip={currentTrip as Trip}
          onAccept={() => undefined}
          onReject={() => undefined}
        />
      </div>
    </main>
  );
}