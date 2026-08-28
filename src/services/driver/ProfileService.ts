// src/services/driver/ProfileService.ts

import { createClient } from '@/lib/supabase';
import { DriverProfile } from '@/types';

export class ProfileService {
    /**
     * Obtém o perfil completo do motorista autenticado
     */
    public static async getCurrentProfile(): Promise<DriverProfile | null> {
        const supabase = createClient();

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            return null;
        }

        return {
            id: profile.id,
            fullName: profile.full_name,
            cpf: profile.cpf,
            phone: profile.phone,
            email: profile.email,
            avatarUrl: profile.avatar_url,
            status: profile.status,
            workStatus: profile.work_status,
            rating: profile.rating,
            totalRides: profile.total_rides,
            createdAt: profile.created_at,
        };
    }

    /**
     * Altera o status de trabalho do motorista (ONLINE / OFFLINE)
     */
    public static async toggleWorkStatus(userId: string, newStatus: 'ONLINE' | 'OFFLINE'): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('drivers')
            .update({ work_status: newStatus })
            .eq('id', userId);

        if (error) {
            throw new Error(`Erro ao atualizar status: ${error.message}`);
        }
    }
}