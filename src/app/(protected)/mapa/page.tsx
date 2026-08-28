// src/app/(protected)/mapa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useRideRequests } from '@/hooks/useRideRequests';
import { ProfileService } from '@/services/driver/ProfileService';
import { RideService } from '@/services/ride/RideService';
import { createClient } from '@/lib/supabase';
import NewRideModal from '@/components/Ride/NewRideModal';


const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function MapaPage() {
    const [isOnline, setIsOnline] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);

    const { location, error } = useDriverLocation(isOnline);
    // Adicionamos o hook de escuta aqui
    const { currentOffer, clearOffer } = useRideRequests(isOnline);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUserId(data.user.id);
        };
        fetchUser();
    }, []);

    const handleToggleStatus = async () => {
        if (!userId) return;
        setIsLoadingToggle(true);
        try {
            const newStatus = isOnline ? 'OFFLINE' : 'ONLINE';
            await ProfileService.toggleWorkStatus(userId, newStatus);
            setIsOnline(!isOnline);
            if (isOnline) clearOffer(); // Limpa ofertas pendentes se ficar offline
        } catch (err) {
            console.error('Erro ao alterar status', err);
        } finally {
            setIsLoadingToggle(false);
        }
    };

    const handleAcceptRide = async (rideId: string) => {
        if (!userId) return;
        const success = await RideService.acceptRide(rideId, userId);

        if (success) {
            clearOffer();
            // Em breve: Redirecionar para a tela de corrida em andamento
            alert('Corrida Aceita! Rota calculada (Módulo 7).');
        } else {
            clearOffer();
            alert('Outro motorista aceitou esta corrida antes de você.');
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-brand-dark">
            <div className="absolute inset-0">
                <DriverMap location={location} />
            </div>

            {!isOnline && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 transition-all" />
            )}

            {/* Renderiza o modal se houver uma nova chamada e o motorista estiver online */}
            {isOnline && currentOffer && (
                <NewRideModal
                    offer={currentOffer}
                    onAccept={handleAcceptRide}
                    onReject={clearOffer}
                />
            )}

            {/* ... Restante do código (Top Bar e Bottom Sheet) mantido igual à versão anterior ... */}

            <div className="absolute bottom-0 w-full bg-brand-surface rounded-t-3xl shadow-sheet z-20 border-t border-brand-border p-6 pb-8">
                <button
                    onClick={handleToggleStatus}
                    disabled={isLoadingToggle}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${isOnline ? 'bg-red-500 text-white' : 'bg-brand-primary text-black'
                        }`}
                >
                    {isLoadingToggle ? 'Carregando...' : (isOnline ? 'Ficar Offline' : 'Ficar Online')}
                </button>
            </div>
        </div>
    );
}