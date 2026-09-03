// src/services/driver/ProfileService.ts

import { createClient } from "@/lib/supabase";

import type {
    DriverProfile,
    DriverStatus,
    DriverWorkStatus,
} from "@/types";


export class ProfileService {
    public static normalizeDriverStatus(value: unknown): DriverStatus {
        const raw = String(value ?? '').trim().toLowerCase();

        const map: Record<string, DriverStatus> = {
            pendente: 'Pendente',
            pending: 'Pendente',
            aprovado: 'Aprovado',
            approved: 'Aprovado',
            reprovado: 'Reprovado',
            rejected: 'Reprovado',
            bloqueado: 'Bloqueado',
            blocked: 'Bloqueado',
        };

        return map[raw] ?? 'Pendente';
    }

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
            .from('motoristas')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            return null;
        }

        return {
            id: profile.id,
            fullName: profile.nome ?? "Motorista",
            cpf: profile.cpf ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? "",
            avatarUrl: profile.avatar_url ?? null,
            status: this.normalizeDriverStatus(profile.status),
            workStatus: profile.work_status ?? "OFFLINE",
            rating: Number(profile.rating ?? 0),
            totalRides: Number(profile.total_rides ?? 0),
            createdAt: profile.created_at,
        };
    }

    /**
 * Atualiza o status operacional do motorista autenticado.
 *
 * OFFLINE: não recebe ofertas.
 * ONLINE: pode receber ofertas.
 * BUSY: possui corrida ativa.
 */
    public static async toggleWorkStatus(
        newStatus: DriverWorkStatus,
    ) {
        const supabase = createClient();

        const {
            data: authData,
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            throw new Error(
                authError?.message ??
                "Usuário não autenticado.",
            );
        }

        const { data, error } = await supabase
            .from("motoristas")
            .update({
                work_status: newStatus,
            })
            .eq("id", authData.user.id)
            .select("id, work_status")
            .single();

        if (error) {
            throw new Error(
                `Não foi possível atualizar o status de trabalho: ${error.message}`,
            );
        }

        return data;
    }
}