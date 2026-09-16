// src/components/Ride/GlobalRideListener.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useActiveRideSync } from '@/hooks/useActiveRideSync';
import { useRideRequests } from '@/hooks/useRideRequests';
import { RideService } from '@/services/ride/RideService';
import { requestNotificationPermission } from '@/lib/notifications';
import { GlobalRideCancellationModal } from './GlobalRideCancellationModal';
import NewRideModal from './NewRideModal';

export function GlobalRideListener() {
    const router = useRouter();
    const pathname = usePathname();
    const { state, dispatch } = useApp();
    const { user } = useAuth();

    // Sincronização global da corrida ativa (detecta cancelamento do passageiro em tempo real)
    const { cancellationState, closeCancellationModal } = useActiveRideSync();

    // Motorista está disponível para chamadas?
    const isOnline = Boolean(user) && (state.status === 'available' || !state.activeRide);
    const { currentOffer, clearOffer, rejectOffer } = useRideRequests(
        isOnline && !state.activeRide,
        state.destinationFilter,
        state.profile?.driverType
    );

    // Solicita permissão de notificação silenciosamente ao carregar
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                requestNotificationPermission().catch(() => {});
            }
        }
    }, []);

    const handleAcceptRide = async (rideId: string) => {
        if (!user || !currentOffer) return;
        try {
            await RideService.acceptRide(rideId, user.id);
            dispatch({
                type: 'ACCEPT_RIDE',
                ride: {
                    id: currentOffer.id,
                    passengerName: currentOffer.passengerName,
                    passengerRating: currentOffer.passengerRating,
                    passengerAccountMonths: 6,
                    passengerTrips: 18,
                    pickup: currentOffer.pickupAddress,
                    dropoff: currentOffer.dropoffAddress,
                    pickupCoordinates: currentOffer.pickupLocation,
                    dropoffCoordinates: currentOffer.dropoffLocation,
                    distanceKm: currentOffer.distanceKm,
                    estimatedMinutes: currentOffer.estimatedMinutes,
                    fare: currentOffer.fareAmount,
                    paymentMethod: (currentOffer.paymentMethod as any) || 'pix',
                    requestedAt: new Date().toISOString(),
                    source: 'app',
                },
            });
            clearOffer();
            router.push(`/corridas/${rideId}`);
        } catch (err) {
            console.error('[GlobalRideListener] Erro ao aceitar corrida:', err);
            clearOffer();
            router.push(`/corridas/${rideId}`);
        }
    };

    const handleRejectRide = () => {
        if (currentOffer) {
            rejectOffer(currentOffer.id);
        } else {
            clearOffer();
        }
        dispatch({ type: 'REJECT_RIDE' });
    };

    const handleDismissCancellation = () => {
        closeCancellationModal();
        if (pathname?.startsWith('/corridas/')) {
            router.push('/mapa');
        }
    };

    return (
        <>
            {/* Pop-up Global de Cancelamento pelo Passageiro */}
            <GlobalRideCancellationModal
                isOpen={cancellationState.isOpen}
                passengerName={cancellationState.passengerName}
                reason={cancellationState.reason}
                onClose={handleDismissCancellation}
            />

            {/* Pop-up Global de Nova Corrida Recebida (quando não estiver na tela /mapa, para não duplicar) */}
            {isOnline && currentOffer && pathname !== '/mapa' && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md">
                        <NewRideModal
                            offer={currentOffer}
                            onAccept={handleAcceptRide}
                            onReject={handleRejectRide}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
