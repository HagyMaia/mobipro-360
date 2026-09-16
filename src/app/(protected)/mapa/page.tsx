// src/app/(protected)/mapa/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Power,
    Navigation,
    XCircle,
    Phone,
    Play,
    Flag,
    CheckCircle2,
    MapPin,
    ExternalLink,
    Loader2,
    MessageSquare,
    Compass
} from "lucide-react";
import { DriverStatusButton } from "@/features/driver-status/components/DriverStatusButton";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useRideRequests } from "@/hooks/useRideRequests";
import { useActiveRideSync } from "@/hooks/useActiveRideSync";
import { ProfileService } from "@/services/driver/ProfileService";
import { RideService } from "@/services/ride/RideService";
import { createClient } from "@/lib/supabase";
import NewRideModal from "@/components/Ride/NewRideModal";
import { DestinationFilterModal } from "@/components/Ride/DestinationFilterModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, Button, Badge } from "@/components/ui";
import { useApp } from "@/lib/store";
import { NavigationModal } from "@/components/NavigationModal";
import { PaymentCheckoutModal } from "@/components/Ride/PaymentCheckoutModal";
import { ChatModal } from "@/components/Ride/ChatModal";
import { ChatService, playMessageReceivedChime } from "@/services/chat/ChatService";
import { requestNotificationPermission } from "@/lib/notifications";
import { formatBRL } from "@/lib/utils";
import type { DriverWorkStatus } from "@/types";
import BottomNav from "@/components/BottomNav";

const DriverMap = dynamic(
    () => import("@/components/map/DriverMap"),
    { ssr: false }
);

export default function MapaPage() {
    const router = useRouter();
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
    const [isChatModalOpen, setChatModalOpen] = useState(false);
    const [isDestFilterModalOpen, setDestFilterModalOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Escuta cancelamentos remotos da corrida ativa
    useActiveRideSync();

    // Se houver corrida ativa no store, motorista está obrigatoriamente online e ativo
    useEffect(() => {
        if (state.activeRide) {
            setIsOnline(true);
        }
    }, [state.activeRide]);

    // Quando o motorista aceita uma corrida, para completamente de buscar/tocar novas chamadas
    const isAvailableForNewRides = (isOnline || state.status === 'available') && !state.activeRide;
    const isLocationTrackingActive = Boolean(isOnline || state.status === 'available' || state.activeRide);

    const { location } = useDriverLocation(isLocationTrackingActive, userId, state.activeRide?.id);

    const {
        currentOffer,
        clearOffer,
        rejectOffer,
    } = useRideRequests(isAvailableForNewRides, state.destinationFilter, state.profile?.driverType);

    const activeRide = state.activeRide;

    // Monitora mensagens não lidas no mapa e toca aviso sonoro
    useEffect(() => {
        if (!activeRide?.id) return;
        const unsubscribe = ChatService.subscribeToRideMessages(activeRide.id, (msg) => {
            if (msg.sender_role !== 'driver' && !isChatModalOpen) {
                setUnreadMessages((prev) => prev + 1);
                playMessageReceivedChime();
            }
        });
        return () => unsubscribe();
    }, [activeRide?.id, isChatModalOpen]);

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

            const currentUserId = authData.user.id;
            if (isComponentMounted) {
                setUserId(currentUserId);
            }

            const {
                data: motorista,
                error: motoristaError,
            } = await supabase
                .from("motoristas")
                .select("nome, status, work_status")
                .eq("id", currentUserId)
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

            const driverOnline =
                driverIsApproved &&
                (motorista.work_status === "ONLINE" || Boolean(state.activeRide));

            setIsOnline(driverOnline);

            // Se houver corrida ativa localmente, valida se ainda está ativa no Supabase
            if (state.activeRide?.id) {
                try {
                    const { data: currentDbRide } = await supabase
                        .from('rides')
                        .select('*')
                        .eq('id', state.activeRide.id)
                        .maybeSingle();

                    const s = String(currentDbRide?.status || '').toUpperCase();
                    if (currentDbRide && (s === 'CANCELLED' || s === 'CANCELADA' || s === 'CANCELED' || s === 'RECUSADA' || s === 'REJECTED')) {
                        dispatch({
                            type: 'CANCEL_RIDE',
                            ride: RideService.parseDbRideToRide(currentDbRide),
                            reason: currentDbRide.cancel_reason || currentDbRide.motivo_cancelamento || 'Cancelada pelo passageiro',
                            cancelledBy: 'passenger'
                        });
                    } else if (currentDbRide && (s === 'COMPLETED' || s === 'FINALIZADA')) {
                        dispatch({ type: 'COMPLETE_RIDE' });
                    }
                } catch (_) {}
            } else {
                // Se não houver corrida ativa no estado local, busca no Supabase para restaurar
                try {
                    const { data: dbRide } = await supabase
                        .from('rides')
                        .select('*')
                        .eq('driver_id', currentUserId)
                        .in('status', ['accepted', 'arrived', 'in-progress', 'ACCEPTED', 'EM_ANDAMENTO', 'A_CAMINHO', 'NO_LOCAL', 'EM_VIAGEM', 'ACEITA'])
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dbRide && isComponentMounted) {
                        const parsed = RideService.parseDbRideToRide(dbRide);
                        dispatch({ type: 'ACCEPT_RIDE', ride: parsed });
                        setIsOnline(true);
                    } else {
                        const { data: corridaData } = await supabase
                            .from('corridas')
                            .select('*')
                            .or(`motorista_id.eq.${currentUserId},driver_id.eq.${currentUserId}`)
                            .in('status', ['accepted', 'arrived', 'in-progress', 'ACCEPTED', 'EM_ANDAMENTO', 'A_CAMINHO', 'NO_LOCAL', 'EM_VIAGEM', 'ACEITA'])
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        if (corridaData && isComponentMounted) {
                            const parsed = RideService.parseDbRideToRide(corridaData);
                            dispatch({ type: 'ACCEPT_RIDE', ride: parsed });
                            setIsOnline(true);
                        }
                    }
                } catch (err) {
                    console.warn('[MapaPage] Erro ao sincronizar corrida ativa no carregamento:', err);
                }
            }
        };

        loadDriverData();

        return () => {
            isComponentMounted = false;
        };
    }, [dispatch, state.activeRide]);

    const handleToggleStatus = async () => {
        if (state.activeRide) {
            if (state.activeRide.id) {
                router.push(`/corridas/${state.activeRide.id}`);
            }
            return;
        }

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

            const isNowOnline = updatedDriver.work_status === "ONLINE";
            setIsOnline(isNowOnline);
            dispatch({ type: 'SET_STATUS', status: isNowOnline ? 'available' : 'offline' });

            if (!isNowOnline) {
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
                await RideService.cancelRide(activeRide.id, userId || undefined, 'Cancelado pelo motorista', 'driver');
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

    const isVoucherRide = Boolean(
        String(activeRide?.paymentMethod || '').toLowerCase() === 'voucher' ||
        (activeRide as any)?.is_voucher ||
        (activeRide as any)?.voucher_code
    );

    const handleFinishAutomaticVoucher = async () => {
        if (!activeRide) return;
        setLoadingRideAction(true);
        try {
            if (activeRide.id) {
                await RideService.completeRide(activeRide.id, userId || undefined, activeRide.fare);
            }
        } catch (err) {
            console.warn('[Mapa] Erro ao finalizar voucher no banco:', err);
        } finally {
            setLoadingRideAction(false);
        }
        clearOffer();
        dispatch({ type: 'COMPLETE_RIDE' });
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
            {/* Top floating HUD header over the map */}
            <header className="absolute left-0 right-0 top-0 z-[1100] px-3.5 pt-3.5 pb-2">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between gap-2.5 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-dark-950/90 p-2.5 shadow-2xl backdrop-blur-2xl transition-all">
                        
                        {/* Motorista & Status */}
                        <div className="flex items-center gap-2.5 pl-1.5 min-w-0">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-amber-300 font-black text-slate-950 text-sm shadow-md shadow-brand/20">
                                {driverName.charAt(0).toUpperCase()}
                                <span
                                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-dark-950 transition-colors ${
                                        state.activeRide
                                            ? 'bg-amber-500 animate-pulse'
                                            : isOnline
                                            ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'bg-slate-400'
                                    }`}
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="truncate text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    Olá, {driverName}
                                </h1>
                                <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {state.activeRide
                                        ? '🚗 Corrida em andamento'
                                        : isOnline
                                        ? '🟢 Recebendo chamadas'
                                        : '⚪ Toque para ficar online'}
                                </p>
                            </div>
                        </div>

                        {/* Ações: Destino Definido & Botão Clicável de Status (Disponível/Offline) */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Botão Destino Definido Moderno */}
                            <button
                                type="button"
                                onClick={() => setDestFilterModalOpen(true)}
                                className={`relative flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black transition-all active:scale-95 shadow-sm ${
                                    state.destinationFilter?.enabled
                                        ? 'bg-brand text-slate-950 ring-2 ring-brand/40 shadow-brand/20'
                                        : 'bg-slate-100 dark:bg-dark-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-dark-700 hover:border-brand/40 hover:bg-slate-200 dark:hover:bg-dark-700'
                                }`}
                                title="Configurar Destino Definido (A Caminho de Casa)"
                            >
                                <Compass
                                    size={15}
                                    className={state.destinationFilter?.enabled ? 'text-slate-950 animate-spin' : 'text-brand-600 dark:text-brand'}
                                />
                                <span>
                                    {state.destinationFilter?.enabled ? 'Destino Ativo' : 'Destino'}
                                </span>
                                {state.destinationFilter?.enabled && (
                                    <span className="flex h-2 w-2 rounded-full bg-slate-950 animate-ping" />
                                )}
                            </button>

                            {/* Botão Disponível / Offline 100% Clicável e Moderno */}
                            {state.activeRide ? (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/corridas/${state.activeRide?.id}`)}
                                    className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2 text-xs font-black text-amber-600 dark:text-amber-400 shadow-md shadow-amber-500/10 transition-all hover:bg-amber-500/25 active:scale-95"
                                    title="Clique para abrir detalhes da corrida em andamento"
                                >
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                    <span>Em Corrida</span>
                                    <ExternalLink size={12} className="opacity-80" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleToggleStatus}
                                    disabled={isLoadingToggle}
                                    className={`relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all active:scale-95 shadow-md ${
                                        isOnline
                                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 hover:bg-emerald-400 border border-emerald-400 ring-2 ring-emerald-500/20'
                                            : 'bg-slate-800 dark:bg-dark-800 text-white border border-slate-700 dark:border-dark-700 hover:bg-slate-700 dark:hover:bg-dark-700/80 shadow-slate-900/20'
                                    }`}
                                    title={isOnline ? 'Clique para ficar Offline' : 'Clique para ficar Disponível'}
                                >
                                    {isLoadingToggle ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Conectando...</span>
                                        </>
                                    ) : isOnline ? (
                                        <>
                                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950 opacity-75" />
                                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-950" />
                                            </span>
                                            <span>Disponível</span>
                                        </>
                                    ) : (
                                        <>
                                            <Power size={13} className="text-slate-400 shrink-0" />
                                            <span>Offline</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Alternador de Tema Discreto */}
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Mensagem de Erro / Alerta Flutuante */}
                    {statusError && (
                        <div className="mt-2 flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/15 p-2.5 text-xs text-red-600 dark:text-red-300 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                            <span>{statusError}</span>
                            <button
                                type="button"
                                onClick={() => setStatusError(null)}
                                className="ml-2 font-bold opacity-75 hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    )}
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
                                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
                                    {activeRide.status === 'accepted' && 'A Caminho do Embarque'}
                                    {activeRide.status === 'arrived' && 'No Local de Embarque'}
                                    {activeRide.status === 'in-progress' && 'Em Viagem até o Destino'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/corridas/${activeRide.id}`)}
                                    className="text-left group flex items-center gap-1.5"
                                    title="Ver tela completa de detalhes da corrida"
                                >
                                    <h3 className="text-base font-black truncate text-slate-900 dark:text-white group-hover:text-brand transition">
                                        {activeRide.passengerName}
                                    </h3>
                                    <ExternalLink size={13} className="text-slate-400 group-hover:text-brand transition" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setUnreadMessages(0);
                                        setChatModalOpen(true);
                                    }}
                                    className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-slate-900 dark:text-brand hover:bg-brand/25 transition active:scale-95 shadow-sm"
                                    aria-label="Abrir chat com passageiro"
                                    title="Chat com passageiro"
                                >
                                    <MessageSquare size={17} />
                                    {unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-dark-900 animate-bounce">
                                            {unreadMessages}
                                        </span>
                                    )}
                                </button>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {formatBRL(activeRide.fare)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {activeRide.distanceKm} km · {activeRide.estimatedMinutes} min
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="rounded-2xl bg-slate-100 dark:bg-dark-800 p-2.5 mb-3 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-emerald-500 shrink-0" />
                                <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{activeRide.pickup}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Navigation size={13} className="text-red-500 shrink-0" />
                                <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{activeRide.dropoff}</span>
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
                                    className="font-black bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
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
                                    className="font-black bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20"
                                >
                                    {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Iniciar Viagem
                                </Button>
                            )}

                            {activeRide.status === 'in-progress' && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    disabled={loadingRideAction}
                                    onClick={() => {
                                        if (isVoucherRide) {
                                            handleFinishAutomaticVoucher();
                                        } else {
                                            setCheckoutModalOpen(true);
                                        }
                                    }}
                                    className="font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                                >
                                    {loadingRideAction ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />} Finalizar Viagem
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Modal de Chat em Tempo Real com o Passageiro */}
                    <ChatModal
                        isOpen={isChatModalOpen}
                        onClose={() => setChatModalOpen(false)}
                        rideId={activeRide.id}
                        passengerName={activeRide.passengerName}
                        driverName={driverName || 'Você'}
                        driverId={userId || undefined}
                    />

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

            <DestinationFilterModal
                isOpen={isDestFilterModalOpen}
                onClose={() => setDestFilterModalOpen(false)}
            />

            <BottomNav />
        </div>
    );
}
