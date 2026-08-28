// src/services/finance/FinanceService.ts
import { createClient } from '@/lib/supabase';

export class FinanceService {
    public static async getDriverEarnings(driverId: string) {
        const supabase = createClient();

        const { data: rides, error } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', driverId)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);

        const totalEarned = rides.reduce((acc: number, ride: any) => acc + Number(ride.fare_amount), 0);

        return { rides: rides || [], totalEarned };
    }
}