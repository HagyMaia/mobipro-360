'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useRideRequests } from '@/hooks/useRideRequests';
import NewRideModal from '@/components/Ride/NewRideModal';
import { RideService } from '@/services/ride/RideService';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function CorridasPage() {
  const router = useRouter();
  const { state } = useApp();
  const { user, loading: authLoading } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const { location } = useDriverLocation(isOnline);
  const { currentOffer, clearOffer } = useRideRequests(isOnline);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg)] text-[color:var(--text)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  const handleAccept = async (rideId: string) => {
    const success = await RideService.acceptRide(rideId, user.id);
    if (success) {
      clearOffer();
      router.push(`/corridas/${rideId}`);
    } else {
      // aceitar falhou
      alert('Não foi possível aceitar esta corrida. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Corridas</h1>
            <p className="text-xs text-[color:var(--muted)]">Solicitações e histórico</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsOnline((v) => !v)}>
              {isOnline ? 'Encerrar Turno' : 'Iniciar Turno'}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4">
        <div className="rounded-2xl overflow-hidden border border-white/6 h-64 mb-4">
          <DriverMap location={location} />
        </div>

        {/* Ofertas ativas */}
        {isOnline && currentOffer ? (
          <div className="mb-4">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-bold">{currentOffer.passengerName}</div>
                  <div className="text-xs text-[color:var(--muted)] mt-1 truncate">{currentOffer.pickupAddress} → {currentOffer.dropoffAddress}</div>
                  <div className="mt-3 text-2xl font-extrabold">R$ {Number(currentOffer.fareAmount ?? 0).toFixed(2)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => clearOffer()}>Recusar</Button>
                  <Button size="sm" onClick={() => handleAccept(currentOffer.id)}>Aceitar</Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mb-4">
            <Card className="p-4">
              <div className="text-sm font-bold">Nenhuma solicitação ativa</div>
              <div className="text-xs text-[color:var(--muted)] mt-1">Ative seu turno para receber solicitações em tempo real.</div>
            </Card>
          </div>
        )}

        {/* Histórico / próximas corridas */}
        <div className="space-y-3">
          {state.rideHistory.slice(0, 8).map((r) => (
            <Card key={r.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-bold">{r.passengerName}</div>
                <div className="text-xs text-[color:var(--muted)]">{r.pickup} → {r.dropoff}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold">R$ {Number(r.fare ?? 0).toFixed(2)}</div>
                <div className="text-xs text-[color:var(--muted)]">{r.status}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
