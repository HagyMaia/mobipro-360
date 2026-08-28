// src/services/ride/RideService.ts
import { createClient } from '@/lib/supabase';
import { RideOffer } from '@/types';

export class RideService {
    /**
     * Tenta aceitar uma corrida. Retorna true se for bem-sucedido.
     * Evita concorrência garantindo que o status atual ainda seja SEARCHING.
     */
    public static async acceptRide(rideId: string, driverId: string): Promise<boolean> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('rides')
            .update({
                driver_id: driverId,
                status: 'ACCEPTED'
            })
            .eq('id', rideId)
            .eq('status', 'SEARCHING') // Trava de concorrência
            .select()
            .single();

        if (error || !data) {
            console.error('Erro ao aceitar corrida ou corrida já aceita por outro:', error);
            return false;
        }

        return true;
    }
}