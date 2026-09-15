// src/services/ride/RideService.ts
import { createClient } from '@/lib/supabase';

// Helper para enviar broadcast imediato em todos os canais de sincronia
function broadcastRideEvent(rideId: string, event: string, payload: any) {
    if (!rideId) return;
    try {
        const supabase = createClient();
        const channels = [
            `passenger-ride-${rideId}`,
            `chat_realtime_${rideId}`,
            `sync_rides_${rideId}`,
            `sync_corridas_${rideId}`,
            `trip:${rideId}`,
            `ride:${rideId}`,
        ];

        for (const chName of channels) {
            try {
                const ch = supabase.channel(chName);
                ch.send({
                    type: 'broadcast',
                    event,
                    payload,
                }).catch(() => {});
            } catch (_) {}
        }
    } catch (_) {}
}

export class RideService {
    /**
     * Tenta aceitar uma corrida com verificação resiliente de concorrência e compatibilidade de colunas.
     */
    public static async acceptRide(rideId: string, driverId?: string): Promise<boolean> {
        const supabase = createClient();

        try {
            console.info('[RideService] Tentando aceitar corrida:', { rideId, driverId });

            // 1. Verifica se a corrida existe e se já foi cancelada
            try {
                const { data: existing, error: fetchErr } = await supabase
                    .from('rides')
                    .select('id, driver_id, status')
                    .eq('id', rideId)
                    .maybeSingle();

                if (!fetchErr && existing) {
                    if (existing.status === 'CANCELLED') {
                        console.warn('[RideService] Corrida já cancelada pelo passageiro.');
                        return false;
                    }
                    if (
                        existing.status === 'ACCEPTED' &&
                        existing.driver_id &&
                        driverId &&
                        existing.driver_id !== driverId &&
                        existing.driver_id !== '00000000-0000-0000-0000-000000000000'
                    ) {
                        console.warn('[RideService] Corrida já aceita por outro motorista:', existing.driver_id);
                        return false;
                    }
                }
            } catch (checkErr) {
                console.warn('[RideService] Aviso ao verificar status prévio:', checkErr);
            }

            // 2. Executa a atribuição do motorista e status ACCEPTED (colunas seguras)
            const updatePayload: Record<string, any> = {
                status: 'ACCEPTED',
            };
            if (driverId) {
                updatePayload.driver_id = driverId;
            }

            let { error } = await supabase
                .from('rides')
                .update(updatePayload)
                .eq('id', rideId);

            if (error) {
                console.warn('[RideService] Tentando atualizar apenas status:', error.message);
                const statusOnly = await supabase
                    .from('rides')
                    .update({ status: 'ACCEPTED' })
                    .eq('id', rideId);
                if (!statusOnly.error) {
                    error = null;
                }
            }

            // Notifica passageiro via Realtime Broadcast
            broadcastRideEvent(rideId, 'status_update', {
                status: 'ACCEPTED',
                driver_id: driverId,
            });

            // 3. Atualiza work_status do motorista para BUSY
            if (driverId) {
                try {
                    await supabase
                        .from('motoristas')
                        .update({ work_status: 'BUSY' })
                        .eq('id', driverId);
                } catch (driverErr) {
                    console.warn('[RideService] Falha ao atualizar work_status do motorista:', driverErr);
                }
            }

            console.info('[RideService] Corrida aceita com sucesso!');
            return true;
        } catch (err) {
            console.error('[RideService] Falha crítica ao aceitar corrida:', err);
            return false;
        }
    }

    /**
     * Motorista chegou ao ponto de embarque (notifica passageiro imediatamente)
     */
    public static async arriveAtPickup(rideId: string, driverId?: string): Promise<boolean> {
        const supabase = createClient();
        try {
            // 1. Atualização direta e segura no banco
            let { error } = await supabase
                .from('rides')
                .update({ status: 'ARRIVED' })
                .eq('id', rideId);

            if (error) {
                console.warn('[RideService] Erro ao atualizar status ARRIVED em rides:', error.message);
            }

            // 2. Atualiza tabela alternativa corridas
            try {
                await supabase
                    .from('corridas')
                    .update({ status: 'CHEGOU' })
                    .eq('id', rideId);
            } catch (_) {}

            // 3. Notificação instantânea via Broadcast para o app do passageiro
            broadcastRideEvent(rideId, 'driver_arrived', {
                status: 'DRIVER_ARRIVED',
                ride_id: rideId,
                driver_id: driverId,
            });
            broadcastRideEvent(rideId, 'status_update', {
                status: 'DRIVER_ARRIVED',
                ride_id: rideId,
                driver_id: driverId,
            });

            return true;
        } catch (err) {
            console.error('[RideService] Erro ao registrar chegada no local:', err);
            return false;
        }
    }

    /**
     * Inicia a corrida (motorista inicia a viagem com o passageiro no veículo)
     */
    public static async startRide(rideId: string, driverId?: string): Promise<boolean> {
        const supabase = createClient();
        try {
            // 1. Atualização direta e segura no banco
            let { error } = await supabase
                .from('rides')
                .update({ status: 'IN_PROGRESS' })
                .eq('id', rideId);

            if (error) {
                console.warn('[RideService] Erro ao atualizar status IN_PROGRESS em rides:', error.message);
            }

            // 2. Atualiza tabela alternativa corridas
            try {
                await supabase
                    .from('corridas')
                    .update({ status: 'EM_ANDAMENTO' })
                    .eq('id', rideId);
            } catch (_) {}

            // 3. Notificação instantânea via Broadcast para o app do passageiro
            broadcastRideEvent(rideId, 'ride_started', {
                status: 'IN_PROGRESS',
                ride_id: rideId,
                driver_id: driverId,
            });
            broadcastRideEvent(rideId, 'status_update', {
                status: 'IN_PROGRESS',
                ride_id: rideId,
                driver_id: driverId,
            });

            return true;
        } catch (err) {
            console.error('[RideService] Erro ao iniciar corrida:', err);
            return false;
        }
    }

    /**
     * Finaliza a corrida com sucesso
     */
    public static async completeRide(rideId: string, driverId?: string, _fareAmount?: number): Promise<boolean> {
        const supabase = createClient();
        try {
            // 1. Atualização direta e segura no banco
            let { error } = await supabase
                .from('rides')
                .update({ status: 'COMPLETED' })
                .eq('id', rideId);

            if (error) {
                console.warn('[RideService] Erro ao atualizar status COMPLETED em rides:', error.message);
            }

            // 2. Atualiza tabela alternativa corridas
            try {
                await supabase
                    .from('corridas')
                    .update({ status: 'FINALIZADA' })
                    .eq('id', rideId);
            } catch (_) {}

            // 3. Notificação instantânea via Broadcast
            broadcastRideEvent(rideId, 'ride_completed', {
                status: 'COMPLETED',
                ride_id: rideId,
            });
            broadcastRideEvent(rideId, 'status_update', {
                status: 'COMPLETED',
                ride_id: rideId,
            });

            if (driverId) {
                try {
                    await supabase
                        .from('motoristas')
                        .update({ work_status: 'ONLINE' })
                        .eq('id', driverId);
                } catch (driverErr) {
                    console.warn('[RideService] Falha ao redefinir work_status:', driverErr);
                }
            }

            return true;
        } catch (err) {
            console.error('[RideService] Erro ao finalizar corrida:', err);
            return false;
        }
    }

    /**
     * Cancela a corrida com identificação clara do autor e motivo
     */
    public static async cancelRide(rideId: string, driverId?: string, reason?: string, cancelledBy: 'driver' | 'passenger' | 'admin' = 'driver'): Promise<boolean> {
        const supabase = createClient();
        try {
            const cancelAuthorText = cancelledBy === 'passenger' ? 'Cancelado pelo passageiro' : 'Cancelado pelo motorista';
            const finalReason = reason || cancelAuthorText;

            // 1. Atualiza status no banco
            let { error } = await supabase
                .from('rides')
                .update({ status: 'CANCELLED' })
                .eq('id', rideId);

            // 2. Atualiza tabela alternativa corridas
            try {
                await supabase
                    .from('corridas')
                    .update({
                        status: 'CANCELADA',
                        motivo_cancelamento: finalReason,
                    })
                    .eq('id', rideId);
            } catch (_) {}

            // 3. Notificação instantânea via Broadcast
            broadcastRideEvent(rideId, 'ride_cancelled', {
                status: 'CANCELLED',
                ride_id: rideId,
                cancelled_by: cancelledBy,
                reason: finalReason,
            });
            broadcastRideEvent(rideId, 'status_update', {
                status: 'CANCELLED',
                ride_id: rideId,
                cancelled_by: cancelledBy,
                reason: finalReason,
            });

            if (driverId) {
                try {
                    await supabase
                        .from('motoristas')
                        .update({ work_status: 'ONLINE' })
                        .eq('id', driverId);
                } catch (driverErr) {
                    console.warn('[RideService] Falha ao redefinir work_status:', driverErr);
                }
            }

            return true;
        } catch (err) {
            console.error('[RideService] Erro ao cancelar corrida:', err);
            return false;
        }
    }

    /**
     * Converte registro do banco em objeto Ride tipado
     */
    public static parseDbRideToRide(r: any): import('@/lib/types').Ride {
        const dbStatus = String(r.status || '').toUpperCase().trim();
        let rideStatus: import('@/lib/types').RideStatus = 'accepted';
        if (dbStatus === 'COMPLETED' || dbStatus === 'CONCLUIDA' || dbStatus === 'FINALIZADA' || dbStatus === 'FINISHED') {
            rideStatus = 'completed';
        } else if (
            dbStatus === 'CANCELLED' ||
            dbStatus === 'CANCELADA' ||
            dbStatus === 'CANCELED' ||
            dbStatus === 'CANCELADO' ||
            dbStatus === 'CANCEL' ||
            dbStatus === 'RECUSADA' ||
            dbStatus === 'REJECTED' ||
            dbStatus === 'ABORTED'
        ) {
            rideStatus = 'cancelled';
        } else if (dbStatus === 'IN_PROGRESS' || dbStatus === 'EM_ANDAMENTO' || dbStatus === 'ON_RIDE') {
            rideStatus = 'in-progress';
        } else if (dbStatus === 'ARRIVED' || dbStatus === 'NO_LOCAL' || dbStatus === 'CHEGOU') {
            rideStatus = 'arrived';
        } else if (dbStatus === 'ACCEPTED' || dbStatus === 'ACEITA' || dbStatus === 'EN_ROUTE') {
            rideStatus = 'accepted';
        } else if (dbStatus === 'SEARCHING' || dbStatus === 'PENDING' || dbStatus === 'PENDENTE') {
            rideStatus = 'pending';
        }

        const cancelReason = r.cancel_reason || r.motivo_cancelamento || r.cancelamento_motivo || r.reason || r.motivo || undefined;
        let cancelledBy: 'passenger' | 'driver' | 'admin' | string | undefined = r.cancelled_by || r.autor_cancelamento || r.cancelado_por;

        if (!cancelledBy && cancelReason) {
            const lower = cancelReason.toLowerCase();
            if (lower.includes('passageiro') || lower.includes('cliente') || lower.includes('user')) {
                cancelledBy = 'passenger';
            } else if (lower.includes('motorista') || lower.includes('driver')) {
                cancelledBy = 'driver';
            } else if (lower.includes('central') || lower.includes('admin') || lower.includes('sistema')) {
                cancelledBy = 'admin';
            }
        }

        if (rideStatus === 'cancelled' && !cancelledBy) {
            cancelledBy = 'passenger';
        }

        const dist = Number(r.distance_km || r.distancia_km || r.distance || r.distancia || 4.2);
        const estMins = Number(r.estimated_minutes || r.duracao_min || r.estimatedMinutes || Math.round(dist * 2.5) || 12);
        const fareVal = Number(r.fare_amount || r.valor || r.fare || r.valor_total || r.price || 20.0);

        return {
            id: String(r.id),
            passengerName: r.passenger_name || r.cliente_nome || r.nome_passageiro || r.passageiro || 'Passageiro Mobipro',
            passengerRating: Number(r.passenger_rating || r.nota_passageiro || 5.0),
            passengerAccountMonths: Number(r.passenger_account_months || 6),
            passengerTrips: Number(r.passenger_trips || 18),
            pickup: r.pickup_address || r.origem_endereco || r.pickup || r.origem || 'Ponto de Embarque',
            dropoff: r.dropoff_address || r.destino_endereco || r.dropoff || r.destino || 'Ponto de Destino',
            pickupCoordinates: {
                latitude: Number(r.pickup_latitude || r.origem_lat || r.pickup_lat || -3.1190),
                longitude: Number(r.pickup_longitude || r.origem_lng || r.pickup_lng || -60.0217),
            },
            dropoffCoordinates: {
                latitude: Number(r.dropoff_latitude || r.destino_lat || r.dropoff_lat || -3.1070),
                longitude: Number(r.dropoff_longitude || r.destino_lng || r.dropoff_lng || -60.0125),
            },
            distanceKm: dist,
            estimatedMinutes: estMins,
            fare: fareVal,
            paymentMethod: (r.payment_method || r.forma_pagamento || 'pix') as any,
            status: rideStatus,
            requestedAt: r.created_at || r.requested_at || new Date().toISOString(),
            startedAt: r.started_at || undefined,
            completedAt: r.completed_at || (rideStatus === 'completed' ? r.updated_at : undefined),
            cancelledAt: rideStatus === 'cancelled' ? (r.cancelled_at || r.updated_at || r.created_at || new Date().toISOString()) : undefined,
            cancelReason,
            cancelledBy,
            source: 'app',
        };
    }

    /**
     * Busca o histórico completo de corridas do motorista (concluídas, canceladas e em andamento)
     * com fusão de cache local permanente e banco de dados
     */
    public static async getDriverRidesHistory(driverId?: string): Promise<import('@/lib/types').Ride[]> {
        const supabase = createClient();
        const results: import('@/lib/types').Ride[] = [];
        const seenIds = new Set<string>();

        // 1. Carrega do armazenamento local imediato (para não perder cancelamentos recentes)
        if (typeof window !== 'undefined') {
            try {
                const rawV2 = window.localStorage.getItem('mobipro_ride_history_v2');
                if (rawV2) {
                    const parsedList = JSON.parse(rawV2);
                    if (Array.isArray(parsedList)) {
                        for (const item of parsedList) {
                            if (item && item.id && !seenIds.has(String(item.id))) {
                                seenIds.add(String(item.id));
                                results.push(item);
                            }
                        }
                    }
                }
            } catch (_) {}

            try {
                const rawState = window.localStorage.getItem('mobipro_state_v1');
                if (rawState) {
                    const parsedState = JSON.parse(rawState);
                    if (Array.isArray(parsedState?.rideHistory)) {
                        for (const item of parsedState.rideHistory) {
                            if (item && item.id && !seenIds.has(String(item.id))) {
                                seenIds.add(String(item.id));
                                results.push(item);
                            }
                        }
                    }
                }
            } catch (_) {}
        }

        try {
            // 2. Busca na tabela rides
            try {
                let query = supabase
                    .from('rides')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (driverId) {
                    query = query.or(`driver_id.eq.${driverId},driver_id.is.null`);
                }

                const { data: ridesData, error: ridesErr } = await query;

                if (!ridesErr && Array.isArray(ridesData)) {
                    for (const row of ridesData) {
                        if (row && row.id && !seenIds.has(String(row.id))) {
                            seenIds.add(String(row.id));
                            results.push(this.parseDbRideToRide(row));
                        }
                    }
                }
            } catch (_) {}

            // 3. Fallback sem filtro estrito de driver_id (para recuperar cancelamentos onde driver_id foi desvinculado)
            try {
                const { data: generalRides } = await supabase
                    .from('rides')
                    .select('*')
                    .in('status', ['CANCELLED', 'CANCELADA', 'CANCELED', 'COMPLETED', 'FINALIZADA'])
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (Array.isArray(generalRides)) {
                    for (const row of generalRides) {
                        if (row && row.id && !seenIds.has(String(row.id))) {
                            seenIds.add(String(row.id));
                            results.push(this.parseDbRideToRide(row));
                        }
                    }
                }
            } catch (_) {}

            // 4. Busca na tabela corridas (compatibilidade)
            try {
                const { data: corridasData, error: corridasErr } = await supabase
                    .from('corridas')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!corridasErr && Array.isArray(corridasData)) {
                    for (const row of corridasData) {
                        if (row && row.id && !seenIds.has(String(row.id))) {
                            seenIds.add(String(row.id));
                            results.push(this.parseDbRideToRide(row));
                        }
                    }
                }
            } catch (_) {}

            // Ordena por data mais recente primeiro
            results.sort((a, b) => {
                const timeA = new Date(a.completedAt || a.cancelledAt || a.requestedAt || 0).getTime();
                const timeB = new Date(b.completedAt || b.cancelledAt || b.requestedAt || 0).getTime();
                return timeB - timeA;
            });

            return results;
        } catch (err) {
            console.error('[RideService] Erro ao buscar histórico de corridas:', err);
            return results;
        }
    }

    /**
     * Atualiza a localização em tempo real do motorista no banco de dados e na corrida ativa
     * para que o app do passageiro veja o carro se movimentando em tempo real.
     */
    public static async updateDriverLiveLocation(
        driverId?: string | null,
        coords?: { latitude: number; longitude: number; heading?: number | null; speed?: number | null } | null,
        activeRideId?: string | null
    ): Promise<void> {
        if (!coords || !coords.latitude || !coords.longitude) return;

        const supabase = createClient();

        // 1. Notificação instantânea via Realtime broadcast para o passageiro
        if (activeRideId) {
            broadcastRideEvent(activeRideId, 'driver_location', {
                latitude: coords.latitude,
                longitude: coords.longitude,
                heading: coords.heading,
                speed: coords.speed,
            });
        }

        // 2. Atualiza no perfil do motorista na tabela motoristas
        if (driverId) {
            try {
                await supabase
                    .from('motoristas')
                    .update({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        lat: coords.latitude,
                        lng: coords.longitude,
                    })
                    .eq('id', driverId);
            } catch (_) {}
        }
    }
}