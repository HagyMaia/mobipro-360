// src/services/ride/RideService.ts
import { createClient } from '@/lib/supabase';

export class RideService {
    /**
     * Tenta aceitar uma corrida com verificação resiliente de concorrência e compatibilidade de colunas.
     */
    public static async acceptRide(rideId: string, driverId: string): Promise<boolean> {
        const supabase = createClient();

        try {
            console.info('[RideService] Tentando aceitar corrida:', { rideId, driverId });

            // 1. Verifica se a corrida existe e se já foi tomada por outro motorista
            try {
                const { data: existing, error: fetchErr } = await supabase
                    .from('rides')
                    .select('id, driver_id, status')
                    .eq('id', rideId)
                    .maybeSingle();

                if (!fetchErr && existing) {
                    if (existing.driver_id && existing.driver_id !== driverId && existing.status === 'ACCEPTED') {
                        console.warn('[RideService] Corrida já aceita por outro motorista:', existing.driver_id);
                        return false;
                    }
                    if (existing.status === 'CANCELLED') {
                        console.warn('[RideService] Corrida já cancelada.');
                        return false;
                    }
                }
            } catch (checkErr) {
                console.warn('[RideService] Aviso ao verificar status prévio:', checkErr);
            }

            // 2. Executa a atribuição do motorista e status ACCEPTED
            const nowIso = new Date().toISOString();
            let updatePayload: Record<string, any> = {
                driver_id: driverId,
                status: 'ACCEPTED',
                updated_at: nowIso,
            };

            let { data, error } = await supabase
                .from('rides')
                .update(updatePayload)
                .eq('id', rideId)
                .select()
                .maybeSingle();

            // Fallback caso a coluna updated_at não exista na tabela
            if (error && error.message && error.message.toLowerCase().includes('updated_at')) {
                console.info('[RideService] Tentando update sem updated_at...');
                const retry = await supabase
                    .from('rides')
                    .update({
                        driver_id: driverId,
                        status: 'ACCEPTED',
                    })
                    .eq('id', rideId)
                    .select()
                    .maybeSingle();
                data = retry.data;
                error = retry.error;
            }

            // Fallback caso RLS ou retorno de select gere erro mas o update tenha funcionado
            if (error) {
                console.warn('[RideService] Erro retornado no update com select:', error.message);
                // Tenta update sem select
                const updateNoSelect = await supabase
                    .from('rides')
                    .update({
                        driver_id: driverId,
                        status: 'ACCEPTED',
                    })
                    .eq('id', rideId);

                if (!updateNoSelect.error) {
                    console.info('[RideService] Update sem select foi bem-sucedido.');
                    data = { id: rideId, status: 'ACCEPTED', driver_id: driverId };
                    error = null;
                }
            }

            if (error) {
                console.error('[RideService] Erro final ao atualizar corrida no Supabase:', error);
                return false;
            }

            // 3. Atualiza work_status do motorista para BUSY
            try {
                await supabase
                    .from('motoristas')
                    .update({ work_status: 'BUSY' })
                    .eq('id', driverId);
            } catch (driverErr) {
                console.warn('[RideService] Falha ao atualizar work_status do motorista:', driverErr);
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
    public static async completeRide(rideId: string, driverId?: string, fareAmount?: number): Promise<boolean> {
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
}