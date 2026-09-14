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
     * Inicia a corrida (motorista chegou ao passageiro e iniciou a viagem)
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
     * Cancela a corrida
     */
    public static async cancelRide(rideId: string, driverId?: string, reason?: string): Promise<boolean> {
        const supabase = createClient();
        try {
            const nowIso = new Date().toISOString();
            let { error } = await supabase
                .from('rides')
                .update({
                    status: 'CANCELLED',
                    cancel_reason: reason || 'Cancelado pelo motorista',
                    updated_at: nowIso,
                })
                .eq('id', rideId);

            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                const retry = await supabase
                    .from('rides')
                    .update({
                        status: 'CANCELLED',
                        cancel_reason: reason || 'Cancelado pelo motorista',
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
            console.error('[RideService] Erro ao cancelar corrida:', err);
            return false;
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