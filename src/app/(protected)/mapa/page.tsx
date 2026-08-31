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

            <div className="absolute bottom-0 w-full bg-white dark:bg-surface rounded-t-3xl shadow-2xl z-20 border-t border-slate-200 dark:border-white/10 p-6 pb-10 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado Atual</span>
                        <span className={`text-lg font-black ${isOnline ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                            {isOnline ? 'Disponível para Corridas' : 'Modo Offline'}
                        </span>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </div>
                <button
                    onClick={handleToggleStatus}
                    disabled={isLoadingToggle}
                    className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                        isOnline 
                        ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-600' 
                        : 'bg-brand text-white shadow-brand/30 hover:bg-brand-600'
                    }`}
                >
                    {isLoadingToggle ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <>
                            {isOnline ? 'Encerrar Turno' : 'Iniciar Turno'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}