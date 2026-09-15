// src/hooks/useRideRequests.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import {
    requestNotificationPermission,
    showRideSystemNotification,
    enableScreenWakeLock,
    disableScreenWakeLock
} from '@/lib/notifications';
import { RideOffer } from '@/types';
import { RiskZoneService } from '@/services/safety/RiskZoneService';
import type { DestinationFilter } from '@/lib/types';

// Chave para armazenar IDs recusados recentemente
const REJECTED_RIDES_KEY = 'mobipro_rejected_rides_v2';

function getRejectedRideIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.sessionStorage.getItem(REJECTED_RIDES_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const now = Date.now();
            const validIds: string[] = [];
            for (const item of parsed) {
                if (typeof item === 'string') {
                    validIds.push(item);
                } else if (item && typeof item === 'object' && item.id) {
                    // Rejeições expiram em 90 segundos para não travar novos testes com a mesma corrida
                    if (!item.time || (now - item.time < 90 * 1000)) {
                        validIds.push(item.id);
                    }
                }
            }
            return new Set(validIds);
        }
    } catch {
        // fallback
    }
    return new Set();
}

function saveRejectedRideId(id: string) {
    if (typeof window === 'undefined' || !id) return;
    try {
        const ids = getRejectedRideIds();
        ids.add(id);
        const entries = Array.from(ids).map((id) => ({ id, time: Date.now() }));
        window.sessionStorage.setItem(REJECTED_RIDES_KEY, JSON.stringify(entries));
    } catch {
        // ignore
    }
}

/**
 * Retorna true se a corrida estiver aberta para recebimento de motorista
 */
function isRideSearching(status?: string | null): boolean {
    if (!status) return true;
    const s = String(status).trim().toUpperCase();
    const closedStatuses = [
        'ACCEPTED',
        'ACEITA',
        'IN_PROGRESS',
        'EM_ANDAMENTO',
        'COMPLETED',
        'FINALIZADA',
        'CONCLUIDA',
        'CANCELLED',
        'CANCELADA',
        'FINISHED'
    ];
    return !closedStatuses.includes(s);
}

/**
 * Avalia se o destino da corrida é compatível com o Filtro de Destino Definido ("A Caminho de Casa")
 */
function checkMatchesDestination(dropoff: string, destFilter?: DestinationFilter | null): boolean {
    if (!destFilter || !destFilter.enabled || !destFilter.address) return true;

    const destText = destFilter.address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dropoffText = dropoff.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Se o texto conter o bairro/endereço do destino
    const words = destText.split(/[\s,/-]+/).filter((w) => w.length > 3);
    for (const word of words) {
        if (dropoffText.includes(word)) return true;
    }

    return false;
}

/**
 * Toca um aviso sonoro nativo sintetizado pelo navegador (Web Audio API)
 */
function playRideNotificationSound() {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);

        if (navigator.vibrate) {
            navigator.vibrate([300, 150, 300, 150, 300]);
        }
    } catch (err) {
        console.warn('[useRideRequests] Notificação sonora não disponível:', err);
    }
}

/**
 * Converte qualquer registro da tabela de corridas para RideOffer com avaliação de segurança e rota
 */
function parseRideToOffer(r: any, destFilter?: DestinationFilter | null): RideOffer {
    const dist = Number(
        r.distance_km ||
        r.distancia_km ||
        r.distance ||
        r.distancia ||
        4.5
    );

    const fareVal = Number(
        r.fare_amount ||
        r.valor ||
        r.fare ||
        r.preco ||
        r.price ||
        r.valor_total ||
        25.00
    );

    const pName =
        r.passenger_name ||
        r.cliente_nome ||
        r.nome_passageiro ||
        r.passageiro_nome ||
        r.passenger ||
        r.user_name ||
        'Passageiro';

    const pRating = Number(r.passenger_rating || r.nota_passageiro || 5.0);

    const pPickup =
        r.pickup_address ||
        r.origem_endereco ||
        r.origem ||
        r.embarque ||
        r.ponto_embarque ||
        'Ponto de Embarque';

    const pDropoff =
        r.dropoff_address ||
        r.destino_endereco ||
        r.destino ||
        r.desembarque ||
        r.ponto_destino ||
        'Destino da Corrida';

    const pPickupLat = Number(
        r.pickup_latitude ||
        r.origem_lat ||
        r.pickup_lat ||
        r.lat_origem ||
        -3.1190
    );

    const pPickupLng = Number(
        r.pickup_longitude ||
        r.origem_lng ||
        r.pickup_lng ||
        r.lng_origem ||
        -60.0217
    );

    const pDropoffLat = Number(
        r.dropoff_latitude ||
        r.destino_lat ||
        r.dropoff_lat ||
        r.lat_destino ||
        -3.1070
    );

    const pDropoffLng = Number(
        r.dropoff_longitude ||
        r.destino_lng ||
        r.dropoff_lng ||
        r.lng_destino ||
        -60.0125
    );

    const estMinutes = r.estimated_minutes
        ? Number(r.estimated_minutes)
        : Math.max(5, Math.round(dist * 2.5)) || 12;

    const rawPayment = String(
        r.payment_method ||
        r.metodo_pagamento ||
        r.forma_pagamento ||
        'pix'
    ).toLowerCase();

    const paymentMethod: 'pix' | 'voucher' = rawPayment.includes('voucher') ? 'voucher' : 'pix';
    const isParticular = paymentMethod !== 'voucher';
    const discountRate = isParticular ? 0.20 : 0.0;
    const netFare = isParticular ? Number((fareVal * 0.80).toFixed(2)) : fareVal;

    // Avaliação de Zonas de Risco / Segurança no Embarque e Desembarque
    const pickupRisk = RiskZoneService.checkAddressRisk(pPickup, {
        latitude: pPickupLat,
        longitude: pPickupLng
    });
    const dropoffRisk = RiskZoneService.checkAddressRisk(pDropoff, {
        latitude: pDropoffLat,
        longitude: pDropoffLng
    });
    const riskAssessment = pickupRisk || dropoffRisk || undefined;

    // Avaliação de correspondência com Destino Definido
    const matchesDest = checkMatchesDestination(pDropoff, destFilter);

    return {
        id: String(r.id),
        passengerName: pName,
        passengerRating: pRating,
        pickupAddress: pPickup,
        pickupLocation: {
            latitude: pPickupLat,
            longitude: pPickupLng,
        },
        dropoffAddress: pDropoff,
        dropoffLocation: {
            latitude: pDropoffLat,
            longitude: pDropoffLng,
        },
        fareAmount: fareVal,
        netFareAmount: netFare,
        discountRate,
        isParticular,
        paymentMethod,
        distanceKm: dist,
        estimatedMinutes: estMinutes,
        expiresInSeconds: 40,
        riskAssessment: riskAssessment ? {
            isRisk: riskAssessment.isRisk,
            level: riskAssessment.level,
            reason: riskAssessment.reason,
            areaName: riskAssessment.areaName,
            tips: riskAssessment.tips,
        } : undefined,
        matchesDestinationFilter: matchesDest,
    };
}

export function useRideRequests(
    isOnline: boolean,
    destinationFilter?: DestinationFilter | null,
    driverType?: 'EMPRESA' | 'PARTICULAR'
) {
    const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
    const lastNotifiedOfferId = useRef<string | null>(null);

    const clearOffer = useCallback(() => {
        setCurrentOffer(null);
    }, []);

    const rejectOffer = useCallback((rideId?: string) => {
        const targetId = rideId || currentOffer?.id;
        if (targetId) {
            saveRejectedRideId(targetId);
        }
        setCurrentOffer(null);
    }, [currentOffer]);

    const acceptOffer = useCallback(async (rideId?: string) => {
        const targetId = rideId || currentOffer?.id;
        if (!targetId) return;
        setCurrentOffer(null);
    }, [currentOffer]);

    // Expiração automática por tempo da oferta atual (40s)
    useEffect(() => {
        if (!currentOffer) return;
        const durationSec = currentOffer.expiresInSeconds ?? 40;
        const timer = setTimeout(() => {
            console.info('[useRideRequests] Oferta expirada por tempo:', currentOffer.id);
            rejectOffer(currentOffer.id);
        }, durationSec * 1000);

        return () => clearTimeout(timer);
    }, [currentOffer, rejectOffer]);

    useEffect(() => {
        if (!isOnline) {
            setCurrentOffer(null);
            disableScreenWakeLock();
            return;
        }

        // Ativa permissão de notificação e previne tela de apagar enquanto estiver online
        enableScreenWakeLock();
        requestNotificationPermission().catch(() => {});

        let isMounted = true;
        let channel1: any = null;
        let channel2: any = null;
        let pollInterval: any = null;
        const supabase = createClient();

        // 1. Função unificada para verificar e processar corridas pendentes
        const processCandidateRides = (rides: any[]) => {
            if (!isMounted || !Array.isArray(rides) || rides.length === 0) return;
            const rejected = getRejectedRideIds();

            // Identifica se o motorista é Perfil Empresa
            const activeDriverType = driverType || (
                typeof window !== 'undefined'
                    ? (window.localStorage.getItem('mobipro_driver_type') as 'EMPRESA' | 'PARTICULAR' || 'PARTICULAR')
                    : 'PARTICULAR'
            );

            const candidate = rides.find((r: any) => {
                if (!r || !r.id) return false;
                if (rejected.has(String(r.id))) return false;
                if (!isRideSearching(r.status)) return false;

                // Se já tiver motorista atribuído e o status não estiver aberto
                if (
                    r.driver_id &&
                    r.driver_id !== '00000000-0000-0000-0000-000000000000' &&
                    String(r.status).toUpperCase() === 'ACCEPTED'
                ) {
                    return false;
                }

                // REGRA DO MOTORISTA DE EMPRESA: Atende EXCLUSIVAMENTE corridas por voucher
                const rawPay = String(
                    r.payment_method ||
                    r.metodo_pagamento ||
                    r.forma_pagamento ||
                    ''
                ).toLowerCase();
                const isVoucher = rawPay.includes('voucher');

                if (activeDriverType === 'EMPRESA' && !isVoucher) {
                    // Motorista de Empresa não recebe corridas particulares
                    return false;
                }

                // Se o Filtro de Destino estiver ativado, só aceita corridas compatíveis com a rota
                if (destinationFilter?.enabled && destinationFilter.address) {
                    const dropoff = r.dropoff_address || r.destino_endereco || r.destino || r.desembarque || '';
                    if (!checkMatchesDestination(dropoff, destinationFilter)) {
                        return false;
                    }
                }

                return true;
            });

            if (candidate && isMounted) {
                const parsed = parseRideToOffer(candidate, destinationFilter);
                setCurrentOffer((prev) => {
                    if (prev?.id === parsed.id) return prev;
                    if (lastNotifiedOfferId.current !== parsed.id) {
                        lastNotifiedOfferId.current = parsed.id;
                        playRideNotificationSound();
                        showRideSystemNotification(parsed); // Dispara notificação nativa do sistema / pop-up
                    }
                    return parsed;
                });
            }
        };

        // 2. Ouvinte de mensagens do Service Worker (quando o app acorda do segundo plano)
        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_RIDE_OFFER_RECEIVED' && event.data.ride && isMounted) {
                processCandidateRides([event.data.ride]);
            }
        };

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        // 3. Checa se o app foi aberto com ?openRide=... na URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const openRideId = urlParams.get('openRide');
            if (openRideId) {
                supabase
                    .from('rides')
                    .select('*')
                    .eq('id', openRideId)
                    .maybeSingle()
                    .then(({ data }: any) => {
                        if (data && isMounted) {
                            processCandidateRides([data]);
                        }
                    });
            }
        }

        // 4. Busca periódica (Polling a cada 2.5 segundos nas duas tabelas)
        const fetchPendingRides = async () => {
            try {
                // Se temos uma oferta em exibição, verifica se ela ainda é válida ou se foi cancelada
                if (currentOffer?.id) {
                    const { data: activeCheck } = await supabase
                        .from('rides')
                        .select('id, status')
                        .eq('id', currentOffer.id)
                        .maybeSingle();

                    if (activeCheck && !isRideSearching(activeCheck.status)) {
                        setCurrentOffer(null);
                        return;
                    }
                }

                // Tabela 1: rides
                const { data: ridesData } = await supabase
                    .from('rides')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (ridesData && ridesData.length > 0) {
                    processCandidateRides(ridesData);
                    return;
                }

                // Tabela 2: corridas
                const { data: corridasData } = await supabase
                    .from('corridas')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (corridasData && corridasData.length > 0) {
                    processCandidateRides(corridasData);
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro no polling de corridas:', err);
            }
        };

        fetchPendingRides();
        pollInterval = setInterval(fetchPendingRides, 2500);

        // 5. Escuta em tempo real via Realtime WebSocket (Tabelas 'rides' e 'corridas')
        try {
            if (supabase?.channel) {
                channel1 = supabase
                    .channel('mobipro:rides_realtime_feed')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'rides',
                        },
                        (payload: any) => {
                            if (!isMounted) return;
                            if (payload.eventType === 'DELETE') {
                                if (payload.old?.id) {
                                    setCurrentOffer((prev) => (prev?.id === String(payload.old.id) ? null : prev));
                                }
                                return;
                            }
                            const row = payload.new;
                            if (!row) return;

                            const s = String(row.status || '').toUpperCase();
                            if (s === 'CANCELLED' || s === 'CANCELADA' || s === 'CANCELED' || s === 'RECUSADA') {
                                setCurrentOffer((prev) => (prev?.id === String(row.id) ? null : prev));
                            } else if (isRideSearching(row.status) && !row.driver_id) {
                                processCandidateRides([row]);
                            }
                        }
                    )
                    .subscribe();

                channel2 = supabase
                    .channel('mobipro:corridas_realtime_feed')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'corridas',
                        },
                        (payload: any) => {
                            if (!isMounted) return;
                            if (payload.eventType === 'DELETE') {
                                if (payload.old?.id) {
                                    setCurrentOffer((prev) => (prev?.id === String(payload.old.id) ? null : prev));
                                }
                                return;
                            }
                            const row = payload.new;
                            if (!row) return;

                            const s = String(row.status || '').toUpperCase();
                            if (s === 'CANCELLED' || s === 'CANCELADA' || s === 'CANCELED' || s === 'RECUSADA') {
                                setCurrentOffer((prev) => (prev?.id === String(row.id) ? null : prev));
                            } else if (isRideSearching(row.status) && !row.driver_id) {
                                processCandidateRides([row]);
                            }
                        }
                    )
                    .subscribe();
            }
        } catch (err) {
            console.warn('[useRideRequests] Erro ao conectar Realtime WebSocket:', err);
        }

        return () => {
            isMounted = false;
            disableScreenWakeLock();
            if (pollInterval) clearInterval(pollInterval);
            if (channel1) {
                try {
                    supabase.removeChannel(channel1);
                } catch {}
            }
            if (channel2) {
                try {
                    supabase.removeChannel(channel2);
                } catch {}
            }
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            }
        };
    }, [isOnline, destinationFilter]);

    return {
        currentOffer,
        clearOffer,
        rejectOffer,
        acceptOffer,
    };
}