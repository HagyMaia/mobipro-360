// src/app/(protected)/mapa/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    Flame,
    Navigation,
    XCircle,
    Phone,
    Play,
    Flag,
    CheckCircle2,
    MapPin,
    ExternalLink,
    Loader2
} from "lucide-react";
import { DriverStatusButton } from "@/features/driver-status/components/DriverStatusButton";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useRideRequests } from "@/hooks/useRideRequests";
import { useActiveRideSync } from "@/hooks/useActiveRideSync";
import { ProfileService } from "@/services/driver/ProfileService";
import { RideService } from "@/services/ride/RideService";
import { createClient } from "@/lib/supabase";
import NewRideModal from "@/components/Ride/NewRideModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusPill } from "@/components/StatusControl";
import { Card, Button, Badge } from "@/components/ui";
import { useApp } from "@/lib/store";
import { NavigationModal } from "@/components/NavigationModal";
import { PaymentCheckoutModal } from "@/components/Ride/PaymentCheckoutModal";
import { requestNotificationPermission } from "@/lib/notifications";
import { formatBRL } from "@/lib/utils";
import type { DriverWorkStatus } from "@/types";
import BottomNav from "@/components/BottomNav";

const DriverMap = dynamic(
    () => import("@/components/map/DriverMap"),
    { ssr: false }
);

export default function MapaPage() {
    const { state, dispatch } = useApp();
    const [isOnline, setIsOnline] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);
    const [driverName, setDriverName] = useState("Motorista");
    const [isApproved, setIsApproved] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [loadingRideAction, setLoadingRideAction] = useState(false);
    const [isNavModalOpen, setNavModalOpen] = useState(false);
    const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);

    // Escuta cancelamentos remotos da corrida ativa
    useActiveRideSync();

    const isEffectiveOnline = (isOnline || state.status === 'available') || Boolean(state.activeRide);
    const { location } = useDriverLocation(isEffectiveOnline, userId, state.activeRide?.id);

    const {
        currentOffer,
        clearOffer,
        rejectOffer,
    } = useRideRequests(isEffectiveOnline);

    const activeRide = state.activeRide;

    useEffect(() => {
        let isComponentMounted = true;

        const loadDriverData = async () => {
            const supabase = createClient();

            const {
                data: authData,
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !authData.user) {
                if (isComponentMounted) {
                    setStatusError(
                        "Não foi possível identificar o motorista autenticado.",
                    );
                }
                return;
            }

            if (isComponentMounted) {
                setUserId(authData.user.id);
            }

            const {
                data: motorista,
                error: motoristaError,
            } = await supabase
                .from("motoristas")
                .select("nome, status, work_status")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (motoristaError || !motorista) {
                if (isComponentMounted) {
                    setStatusError(
                        "Não foi possível carregar seu perfil de motorista.",
                    );
                }
                return;
            }

            const normalizedApprovalStatus =
                ProfileService.normalizeDriverStatus(
                    motorista.status,
                );

            const driverIsApproved =
                normalizedApprovalStatus === "Aprovado";

            if (!isComponentMounted) {
                return;
            }

            if (motorista.nome) {
                setDriverName(
                    motorista.nome.split(" ")[0],
                );
            }

            setIsApproved(driverIsApproved);

            setIsOnline(
                driverIsApproved &&
                motorista.work_status === "ONLINE",
            );
        };

        loadDriverData();

        return () => {
            isComponentMounted = false;
        };
    }, []);

    const handleToggleStatus = async () => {
        if (!userId) {
            setStatusError(
                "Não foi possível identificar o motorista autenticado.",
            );
            return;
        }

        if (!isApproved) {
            setStatusError(
                "Seu cadastro ainda não está aprovado para receber corridas.",
            );
            return;
        }

        setStatusError(null);
        setIsLoadingToggle(true);

        try {
            const newStatus: DriverWorkStatus = isOnline
                ? "OFFLINE"
                : "ONLINE";

            if (newStatus === "ONLINE") {
                requestNotificationPermission();
            }

            const updatedDriver =
                await ProfileService.toggleWorkStatus(
                    newStatus,
                );

            setIsOnline(
                updatedDriver.work_status === "ONLINE",
            );

            if (newStatus === "OFFLINE") {
                clearOffer();
            }
        } catch (error) {
            setStatusError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível alterar seu status. Tente novamente.",
            );
        } finally {
            setIsLoadingToggle(false);
        }
    };

    const handleAcceptRide = async (rideId: string) => {
        try {
            await RideService.acceptRide(rideId, userId || undefined);
            if (currentOffer) {
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
                        distanceKm: currentOffer.distanceKm,
                        estimatedMinutes: currentOffer.estimatedMinutes,
                        fare: currentOffer.fareAmount,
                        paymentMethod: 'pix',
                        requestedAt: new Date().toISOString(),
                        source: 'app',
                    },
                });
            }
            clearOffer();
        } catch (err) {
            console.error('[Mapa] Erro ao aceitar corrida:', err);
            clearOffer();
        }
    };

    const handleRejectOffer = (rideId?: string) => {
        if (rideId) {
            rejectOffer(rideId);
        } else {
            clearOffer();
        }
        dispatch({ type: 'REJECT_RIDE' });
    };

    const handleCancelActiveRide = async () => {
        if (!window.confirm('Tem certeza que deseja cancelar esta corrida?')) {
            return;
        }

        if (activeRide?.id) {
            setLoadingRideAction(true);
            try {
                await RideService.cancelRide(activeRide.id, userId || undefined);
            } catch (err) {
                console.warn('[Mapa] Erro ao cancelar corrida no banco:', err);
            } finally {
                setLoadingRideAction(false);
            }
        }
        clearOffer();
        dispatch({ type: 'CANCEL_RIDE' });
    };

    const handleArriveActiveRide = async () => {
        if (activeRide?.id) {
            setLoadingRideAction(true);
            try {
                await RideService.arriveAtPickup(activeRide.id);
            } catch (err) {
                console.warn('[Mapa] Erro ao registrar chegada no local:', err);
            } finally {
                setLoadingRideAction(false);
            }
        }
        dispatch({ type: 'ARRIVE_AT_PICKUP' });
    };

    const handleStartActiveRide = async () => {
        if (activeRide?.id) {
            setLoadingRideAction(true);
            try {
                await RideService.startRide(activeRide.id);
            } catch (err) {
                console.warn('[Mapa] Erro ao iniciar corrida no banco:', err);
            } finally {
                setLoadingRideAction(false);
            }
        }
        dispatch({ type: 'START_RIDE' });
    };

    const handleFinishCheckout = async (data: {
        paymentMethod: 'pix' | 'cash' | 'card' | 'voucher';
        finalAmount: number;
        rating: number;
        ratingFeedback: string[];
        comments: string;
        voucherCode?: string;
    }) => {
        if (activeRide?.id) {
            try {
                await RideService.completeRide(activeRide.id, userId || undefined, data.finalAmount);
            } catch (err) {
                console.warn('[Mapa] Erro ao finalizar corrida no banco:', err);
            }
        }
        clearOffer();
        dispatch({ type: 'COMPLETE_RIDE' });
    };

    // Pontos do mapa: embarque e destino são calculados dinamicamente
    // e ficam completamente nulos quando a corrida é cancelada
    const pickupLocation = useMemo(() => {
        if (activeRide) {
            return {
                latitude: activeRide.pickupCoordinates?.latitude ?? -3.1190,
                longitude: activeRide.pickupCoordinates?.longitude ?? -60.0217,
                label: 'EMBARQUE',
                address: activeRide.pickup,
            };
        }
        if (currentOffer) {
            return {
                latitude: currentOffer.pickupLocation.latitude,
                longitude: currentOffer.pickupLocation.longitude,
                label: 'EMBARQUE',
                address: currentOffer.pickupAddress,
            };
        }
        return null;
    }, [activeRide, currentOffer]);

    const dropoffLocation = useMemo(() => {
        if (activeRide) {
            return {
                latitude: activeRide.dropoffCoordinates?.latitude ?? -3.1072,
                longitude: activeRide.dropoffCoordinates?.longitude ?? -60.0125,
                label: 'DESTINO',
                address: activeRide.dropoff,
            };
        }
        if (currentOffer) {
            return {
                latitude: currentOffer.dropoffLocation.latitude,
                longitude: currentOffer.dropoffLocation.longitude,
                label: 'DESTINO',
                address: currentOffer.dropoffAddress,
            };
        }
        return null;
    }, [activeRide, currentOffer]);

    const navApp = state.navApp ?? 'waze';
    const isGoingToDropoff = activeRide?.status === 'arrived' || activeRide?.status === 'in-progress';
    const navAddress = isGoingToDropoff ? activeRide?.dropoff : activeRide?.pickup;
    const navCoords = isGoingToDropoff ? activeRide?.dropoffCoordinates : activeRide?.pickupCoordinates;
    const navLabel = isGoingToDropoff ? 'Navegar ao Destino' : 'Navegar ao Embarque';

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white font-sans">
            {/* Top header over the map */}
            <header className="absolute left-0 right-0 top-0 z-[1100] px-4 pt-4 pb-3 bg-white/90 dark:bg-dark-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-dark-700/80 shadow-md">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white">
                                Olá, <span className="text-brand-600 dark:text-brand">{driverName}</span> 👋
                            </h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {activeRide ? 'Corrida em andamento' : isOnline ? 'Disponível para chamadas' : 'Modo Offline'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/radar"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black shadow-sm active:scale-95 transition hover:bg-amber-500/25"
                                title="Ver Radar de Demanda"
                            >
                                <Flame size={14} className="text-amber-500" />
                                <span>Radar</span>
                            </Link>
                            <ThemeToggle />
                            <StatusPill />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mapa Interativo com Carro, Embarque, Destino e Trajeto */}
            <div className="absolute inset-0">
                <DriverMap
                    location={location}
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                    showRoute={Boolean(pickupLocation || dropoffLocation)}
                    routeMode={activeRide?.status === 'accepted' ? 'to-pickup' : (activeRide?.status === 'arrived' || activeRide?.status === 'in-progress') ? 'to-dropoff' : 'full'}
                />
            </div>

            {!isOnline && !activeRide && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 transition-all pointer-events-none" />
            )}

            {/* Modal de Nova Solicitação */}
            {isOnline && !activeRide && currentOffer && (
                <NewRideModal
                    offer={currentOffer}
                    onAccept={handleAcceptRide}
                    onReject={() => handleRejectOffer(currentOffer.id)}
                />
            )}

            {/* Card Flutuante de Corrida Ativa no Mapa */}
            {activeRide && (
                <div className="absolute bottom-20 inset-x-0 mx-auto w-full max-w-lg px-4 z-[1050]">
                    <Card className="border-2 border-brand/60 bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl shadow-2xl p-4 rounded-3xl text-slate-900 dark:text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand">
                                    {activeRide.status === 'accepted' && '🚗 A Caminho do Embarque'}
                                    {activeRide.status === 'arrived' && '📍 No Local de Embarque'}
                                    {activeRide.status === 'in-progress' && '🏁 Em Viagem até o Destino'}
                                </span>
                                <h3 className="text-base font-black truncate">{activeRide.passengerName}</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatBRL(activeRide.fare)}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {activeRide.distanceKm} km · {activeRide.estimatedMinutes} min
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="rounded-2xl bg-slate-100 dark:bg-dark-800 p-2.5 mb-3 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-emerald-500 shrink-0" />
                                <span className="truncate font-semibold">{activeRide.pickup}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Navigation size={13} className="text-red-500 shrink-0" />
                                <span className="truncate font-semibold">{activeRide.dropoff}</span>
                            </div>
                        </div>

                        {/* Botão de Navegação Externa (Waze / Google Maps) */}
                        {navAddress && (
                            <button
                                onClick={() => setNavModalOpen(true)}
                                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-2.5 text-xs font-black text-slate-950 shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95"
                            >
                                <Navigation size={14} />
                                {navLabel}
                                <span className="rounded-lg bg-black/15 px-1.5 py-0.5 text-[10px] uppercase font-bold">
                                    {navApp}
                                </span>
                                <ExternalLink size={12} className="opacity-80" />
                            </button>
                        )}

                        {/* Ações da Corrida */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={loadingRideAction}
                                onClick={handleCancelActiveRide}
                                className="text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                                {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Cancelar
                            </Button>

                            {activeRide.status === 'accepted' && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    disabled={loadingRideAction}
                                    onClick={handleArriveActiveRide}
                                    className="font-black bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950"
                                >
                                    {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Cheguei ao Local
                                </Button>
                            )}

                            {activeRide.status === 'arrived' && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    disabled={loadingRideAction}
                                    onClick={handleStartActiveRide}
                                    className="font-black bg-emerald-500 hover:bg-emerald-600"
                                >
                                    {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Iniciar Viagem
                                </Button>
                            )}

                            {activeRide.status === 'in-progress' && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    disabled={loadingRideAction}
                                    onClick={() => setCheckoutModalOpen(true)}
                                    className="font-black bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Finalizar Viagem
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Modal de Navegação (Waze / Google Maps) */}
                    {navAddress && (
                        <NavigationModal
                            isOpen={isNavModalOpen}
                            onClose={() => setNavModalOpen(false)}
                            address={navAddress}
                            coords={navCoords}
                            destinationLabel={activeRide.status === 'in-progress' ? 'Destino' : 'Embarque'}
                        />
                    )}

                    {/* Modal de Checkout / PIX QR Code e Avaliação */}
                    <PaymentCheckoutModal
                        isOpen={isCheckoutModalOpen}
                        onClose={() => setCheckoutModalOpen(false)}
                        rideId={activeRide.id}
                        fareAmount={activeRide.fare}
                        passengerName={activeRide.passengerName}
                        pickupAddress={activeRide.pickup}
                        dropoffAddress={activeRide.dropoff}
                        onFinishRide={handleFinishCheckout}
                    />
                </div>
            )}

            {/* Bottom Sheet com Status do Motorista (quando não houver corrida ativa) */}
            {!activeRide && (
                <div className="absolute bottom-16 inset-x-0 w-full bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl rounded-t-3xl shadow-2xl z-[1050] border-t border-slate-200 dark:border-white/10 p-5 pb-6 transition-all">
                    {statusError && (
                        <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-300">
                            {statusError}
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado Atual</span>
                            <span className={`text-base font-black ${isOnline ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                {isOnline ? 'Disponível para Corridas' : 'Modo Offline'}
                            </span>
                        </div>
                        <div className={`h-3.5 w-3.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                    <DriverStatusButton
                        status={isOnline ? "ONLINE" : "OFFLINE"}
                        isLoading={isLoadingToggle}
                        onToggle={handleToggleStatus}
                    />
                </div>
            )}

            <BottomNav />
        </div>
    );
}
