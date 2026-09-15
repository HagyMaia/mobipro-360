// src/services/ride/RideService.ts
import { createClient } from '@/lib/supabase';

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
                    // Se já estiver aceita por outro motorista com ID válido diferente
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

            // 2. Executa a atribuição do motorista e status ACCEPTED
            const nowIso = new Date().toISOString();
            const updatePayload: Record<string, any> = {
                status: 'ACCEPTED',
                updated_at: nowIso,
            };
            if (driverId) {
                updatePayload.driver_id = driverId;
            }

            let { error } = await supabase
                .from('rides')
                .update(updatePayload)
                .eq('id', rideId);

            // Fallback caso a coluna updated_at não exista na tabela
            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                console.info('[RideService] Tentando update sem updated_at...');
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'ACCEPTED',
                        ...(driverId ? { driver_id: driverId } : {}),
                    })
                    .eq('id', rideId);
                error = retry.error;
            }

            // Fallback caso driver_id gere erro de tipo ou FK
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

            if (error) {
                console.error('[RideService] Erro final ao atualizar corrida no Supabase:', error);
                return false;
            }

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
     * Motorista chegou ao ponto de embarque (notifica passageiro)
     */
    public static async arriveAtPickup(rideId: string): Promise<boolean> {
        const supabase = createClient();
        try {
            const nowIso = new Date().toISOString();
            let { error } = await supabase
                .from('rides')
                .update({
                    status: 'ARRIVED',
                    arrived_at: nowIso,
                    updated_at: nowIso,
                })
                .eq('id', rideId);

            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'ARRIVED',
                    })
                    .eq('id', rideId);
                error = retry.error;
            }

            return !error;
        } catch (err) {
            console.error('[RideService] Erro ao registrar chegada no local:', err);
            return false;
        }
    }

    /**
     * Inicia a corrida (motorista inicia a viagem com o passageiro no veículo)
     */
    public static async startRide(rideId: string): Promise<boolean> {
        const supabase = createClient();
        try {
            const nowIso = new Date().toISOString();
            let { error } = await supabase
                .from('rides')
                .update({
                    status: 'IN_PROGRESS',
                    started_at: nowIso,
                    updated_at: nowIso,
                })
                .eq('id', rideId);

            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'IN_PROGRESS',
                        started_at: nowIso,
                    })
                    .eq('id', rideId);
                error = retry.error;
            }

            return !error;
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
            const nowIso = new Date().toISOString();
            let { error } = await supabase
                .from('rides')
                .update({
                    status: 'COMPLETED',
                    completed_at: nowIso,
                    updated_at: nowIso,
                })
                .eq('id', rideId);

            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'COMPLETED',
                        completed_at: nowIso,
                    })
                    .eq('id', rideId);
                error = retry.error;
            }

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

            return !error;
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
            const nowIso = new Date().toISOString();
            const cancelAuthorText = cancelledBy === 'passenger' ? 'Cancelado pelo passageiro' : 'Cancelado pelo motorista';
            const finalReason = reason || cancelAuthorText;

            let { error } = await supabase
                .from('rides')
                .update({
                    status: 'CANCELLED',
                    cancel_reason: finalReason,
                    cancelled_by: cancelledBy,
                    updated_at: nowIso,
                })
                .eq('id', rideId);

            if (error && error.message) {
                // Tenta sem a coluna cancelled_by caso ela ainda não exista
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'CANCELLED',
                        cancel_reason: finalReason,
                    })
                    .eq('id', rideId);
                error = retry.error;
            }

            // Também tenta atualizar tabela corridas caso ela seja a principal
            try {
                await supabase
                    .from('corridas')
                    .update({
                        status: 'CANCELADA',
                        motivo_cancelamento: finalReason,
                    })
                    .eq('id', rideId);
            } catch (_) {}

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

            return !error;
        } catch (err) {
            console.error('[RideService] Erro ao cancelar corrida:', err);
            return false;
        }
    }

    /**
     * Converte registro do banco em objeto Ride tipado
     */
    public static parseDbRideToRide(r: any): import('@/lib/types').Ride {
        const dbStatus = String(r.status || '').toUpperCase();
        let rideStatus: import('@/lib/types').RideStatus = 'accepted';
        if (dbStatus === 'COMPLETED' || dbStatus === 'CONCLUIDA' || dbStatus === 'FINALIZADA') {
            rideStatus = 'completed';
        } else if (dbStatus === 'CANCELLED' || dbStatus === 'CANCELADA' || dbStatus === 'CANCELED' || dbStatus === 'RECUSADA') {
            rideStatus = 'cancelled';
        } else if (dbStatus === 'IN_PROGRESS' || dbStatus === 'EM_ANDAMENTO') {
            rideStatus = 'in-progress';
        } else if (dbStatus === 'ARRIVED' || dbStatus === 'NO_LOCAL') {
            rideStatus = 'arrived';
        } else if (dbStatus === 'ACCEPTED' || dbStatus === 'ACEITA') {
            rideStatus = 'accepted';
        } else if (dbStatus === 'SEARCHING' || dbStatus === 'PENDING') {
            rideStatus = 'pending';
        }

        const cancelReason = r.cancel_reason || r.motivo_cancelamento || r.cancelamento_motivo || undefined;
        let cancelledBy: 'passenger' | 'driver' | 'admin' | string | undefined = r.cancelled_by || r.autor_cancelamento;

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

        const dist = Number(r.distance_km || r.distancia_km || r.distance || 4.2);
        const estMins = Number(r.estimated_minutes || r.duracao_min || r.estimatedMinutes || Math.round(dist * 2.5) || 12);
        const fareVal = Number(r.fare_amount || r.valor || r.fare || r.valor_total || r.price || 20.0);

        return {
            id: String(r.id),
            passengerName: r.passenger_name || r.cliente_nome || r.nome_passageiro || 'Passageiro Mobipro',
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
            requestedAt: r.created_at || new Date().toISOString(),
            startedAt: r.started_at || undefined,
            completedAt: r.completed_at || (rideStatus === 'completed' ? r.updated_at : undefined),
            cancelledAt: rideStatus === 'cancelled' ? (r.updated_at || r.created_at) : undefined,
            cancelReason,
            cancelledBy,
            source: 'app',
        };
    }

    /**
     * Busca o histórico completo de corridas do motorista (concluídas, canceladas e em andamento)
     */
    public static async getDriverRidesHistory(driverId?: string): Promise<import('@/lib/types').Ride[]> {
        const supabase = createClient();
        const results: import('@/lib/types').Ride[] = [];
        const seenIds = new Set<string>();

        try {
            // 1. Busca na tabela rides
            let query = supabase
                .from('rides')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (driverId) {
                // Busca corridas atribuídas ao motorista ou finalizadas/canceladas recentemente
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

            // 2. Busca na tabela corridas (compatibilidade)
            try {
                let corridasQuery = supabase
                    .from('corridas')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (driverId) {
                    corridasQuery = corridasQuery.or(`motorista_id.eq.${driverId},driver_id.eq.${driverId}`);
                }

                const { data: corridasData, error: corridasErr } = await corridasQuery;

                if (!corridasErr && Array.isArray(corridasData)) {
                    for (const row of corridasData) {
                        if (row && row.id && !seenIds.has(String(row.id))) {
                            seenIds.add(String(row.id));
                            results.push(this.parseDbRideToRide(row));
                        }
                    }
                }
            } catch (_) {}

            // Ordena por data decrescente
            results.sort((a, b) => {
                const timeA = new Date(a.requestedAt || 0).getTime();
                const timeB = new Date(b.requestedAt || 0).getTime();
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
        const nowIso = new Date().toISOString();

        // 1. Atualiza na tabela da corrida ativa (para o passageiro acompanhar)
        if (activeRideId) {
            try {
                await supabase
                    .from('rides')
                    .update({
                        motorista_lat: coords.latitude,
                        motorista_lng: coords.longitude,
                        driver_latitude: coords.latitude,
                        driver_longitude: coords.longitude,
                        updated_at: nowIso,
                    })
                    .eq('id', activeRideId);
            } catch (err1) {
                try {
                    await supabase
                        .from('rides')
                        .update({
                            motorista_lat: coords.latitude,
                            motorista_lng: coords.longitude,
                        })
                        .eq('id', activeRideId);
                } catch (_) {}
            }
        }

        // 2. Atualiza no perfil do motorista
        if (driverId) {
            try {
                await supabase
                    .from('motoristas')
                    .update({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        updated_at: nowIso,
                    })
                    .eq('id', driverId);
            } catch (err2) {
                try {
                    await supabase
                        .from('motoristas')
                        .update({
                            lat: coords.latitude,
                            lng: coords.longitude,
                        })
                        .eq('id', driverId);
                } catch (_) {}
            }
        }
    }
}