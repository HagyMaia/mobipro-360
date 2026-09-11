// src/services/ride/RideService.ts
import { createClient } from '@/lib/supabase';

export class RideService {
    /**
     * Tenta aceitar uma corrida. Retorna true se for bem-sucedido.
     * Evita concorrência garantindo que o status atual ainda seja SEARCHING.
     */
    public static async acceptRide(rideId: string, driverId: string): Promise<boolean> {
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('rides')
                .update({
                    driver_id: driverId,
                    status: 'ACCEPTED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', rideId)
                .eq('status', 'SEARCHING') // Trava de concorrência
                .select()
                .single();

            if (error || !data) {
                console.error('[RideService] Erro ao aceitar corrida ou corrida já aceita:', error);
                return false;
            }

            // Atualiza status do motorista para BUSY
            try {
                await supabase
                    .from('motoristas')
                    .update({ work_status: 'BUSY' })
                    .eq('id', driverId);
            } catch (driverErr) {
                console.warn('[RideService] Falha ao atualizar work_status do motorista:', driverErr);
            }

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
            const { error } = await supabase
                .from('rides')
                .update({
                    status: 'IN_PROGRESS',
                    started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', rideId);

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
            const { error } = await supabase
                .from('rides')
                .update({
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', rideId);

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
            const { error } = await supabase
                .from('rides')
                .update({
                    status: 'CANCELLED',
                    cancel_reason: reason || 'Cancelado pelo motorista',
                    updated_at: new Date().toISOString()
                })
                .eq('id', rideId);

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