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
import { ThemeToggle } from '@/components/ThemeToggle';
import StatusControl, { StatusPill } from '@/components/StatusControl';
import { Card, Button } from '@/components/ui';


const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

export default function MapaPage() {
    const [isOnline, setIsOnline] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);
    const [driverName, setDriverName] = useState('Motorista');

    const { location, error } = useDriverLocation(isOnline);
    // Adicionamos o hook de escuta aqui
    const { currentOffer, clearOffer } = useRideRequests(isOnline);
    const [previewMounted, setPreviewMounted] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUserId(data.user.id);
            try {
                if (data?.user) {
                    const { data: motorista } = await supabase
                        .from('motoristas')
                        .select('nome')
                        .eq('id', data.user.id)
                        .maybeSingle();
                    if (motorista?.nome) setDriverName(motorista.nome.split(' ')[0]);
                }
            } catch (err) {
                // ignore
            }
        };
        fetchUser();
    }, []);

    // trigger mount animation for preview
    useEffect(() => {
        if (currentOffer) {
            setPreviewMounted(false);
            // next frame to allow transition
            requestAnimationFrame(() => setPreviewMounted(true));
        } else {
            setPreviewMounted(false);
        }
    }, [currentOffer]);

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
            {/* Top header over the map */}
            <header className="absolute left-0 right-0 top-0 z-30 px-4 pt-safe-top pb-3">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-extrabold text-white">Olá, <span className="text-brand-400">{driverName}</span></h1>
                            <p className="text-xs text-slate-300">Toque em iniciar para receber corridas</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <StatusPill />
                        </div>
                    </div>
                </div>
            </header>

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

            {/* Compact preview when there's an offer */}
            {isOnline && currentOffer && (
                <div className="absolute top-24 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4">
                    <Card className={`p-3 rounded-2xl shadow-xl transition-all duration-300 ${previewMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'} bg-white/95 text-slate-900 border border-slate-200 dark:bg-dark-800/85 dark:text-white dark:border-dark-700`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-sm font-bold truncate">Nova chamada</div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{currentOffer.passengerName} · {currentOffer.estimatedMinutes} min · {currentOffer.distanceKm} km</div>
                                <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">R$ {(currentOffer.fareAmount ?? 0).toFixed(2)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Button variant="outline" className="min-w-[96px]" onClick={() => clearOffer()}>Recusar</Button>
                                <Button className="min-w-[96px]" onClick={() => handleAcceptRide(currentOffer.id)}>Aceitar</Button>
                            </div>
                        </div>
                    </Card>
                </div>
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