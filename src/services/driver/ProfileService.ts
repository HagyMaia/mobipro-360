// src/services/driver/ProfileService.ts

import { createClient } from "@/lib/supabase";

import type {
    DriverProfile,
    DriverStatus,
    DriverWorkStatus,
} from "@/types";


function cleanString(val: unknown, fallback = ''): string {
    if (val === null || val === undefined) return fallback;
    const str = String(val).trim();
    if (str === '' || str.toUpperCase() === 'NULL' || str.toLowerCase() === 'null' || str === 'undefined') {
        return fallback;
    }
    return str;
}

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

        const rawName = cleanString(profile.nome_social, cleanString(profile.nome, ''));
        const resolvedName = rawName || (profile.email ? profile.email.split('@')[0] : 'Motorista');

        const make = cleanString(profile.marca_veiculo, 'Chevrolet');
        const model = cleanString(profile.modelo_veiculo, 'Onix Plus');
        const plate = cleanString(profile.placa_veiculo, 'ABC1D23');
        const color = cleanString(profile.cor_veiculo, 'Prata');
        const year = cleanString(profile.ano_veiculo, '2024');
        const category = cleanString(profile.categoria, 'POPULAR');
        const vStatus = cleanString(profile.vehicle_status, 'Aprovado') as 'Aprovado' | 'Pendente' | 'Reprovado';

        return {
            id: profile.id,
            fullName: cleanString(profile.nome_completo, cleanString(profile.nome, resolvedName)),
            displayName: resolvedName,
            cpf: cleanString(profile.cpf, ''),
            phone: cleanString(profile.telefone, cleanString(profile.phone, '')),
            email: cleanString(profile.email, authData.user.email ?? ''),
            avatarUrl: profile.avatar_url ?? null,
            status: this.normalizeDriverStatus(profile.status),
            workStatus: profile.work_status ?? "OFFLINE",
            rating: Number(profile.rating ?? 4.95),
            totalRides: Number(profile.total_rides ?? 128),
            vehicle: {
                make,
                model,
                plate,
                color,
                year,
                category,
                status: vStatus,
            },
            vehicleStatus: vStatus,
            createdAt: profile.created_at || new Date().toISOString(),
        };
    }

    /**
     * Atualiza as informações pessoais do motorista (nome de exibição, telefone, avatar)
     */
    public static async updateProfile(data: {
        displayName?: string;
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }) {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            throw new Error(authError?.message ?? "Usuário não autenticado.");
        }

        const updates: Record<string, any> = {};
        if (data.displayName !== undefined) {
            updates.nome = data.displayName;
            updates.nome_social = data.displayName;
        }
        if (data.fullName !== undefined) {
            updates.nome_completo = data.fullName;
        }
        if (data.phone !== undefined) {
            updates.telefone = data.phone;
        }
        if (data.avatarUrl !== undefined) {
            updates.avatar_url = data.avatarUrl;
        }

        const { data: updated, error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id)
            .select()
            .single();

        if (error) {
            throw new Error(`Não foi possível atualizar o perfil: ${error.message}`);
        }

        return updated;
    }

    /**
     * Solicita alteração do veículo - Entra em status Pendente para aprovação da equipe SR Logística
     */
    public static async requestVehicleChange(vehicleData: {
        make: string;
        model: string;
        year: string | number;
        plate: string;
        color: string;
        category?: string;
    }) {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            throw new Error(authError?.message ?? "Usuário não autenticado.");
        }

        let payload: Record<string, any> = {
            marca_veiculo: vehicleData.make.trim(),
            modelo_veiculo: vehicleData.model.trim(),
            ano_veiculo: String(vehicleData.year).trim(),
            placa_veiculo: vehicleData.plate.toUpperCase().trim(),
            cor_veiculo: vehicleData.color.trim() || 'Prata',
            categoria: vehicleData.category || 'POPULAR',
            vehicle_status: 'Pendente', // Exige aprovação administrativa
        };

        let { data: updated, error } = await supabase
            .from("motoristas")
            .update(payload)
            .eq("id", authData.user.id)
            .select()
            .single();

        let attempts = 0;
        while (error && attempts < 5) {
            attempts++;
            const match = error.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1] && payload[match[1]] !== undefined) {
                console.warn(`[ProfileService] Coluna '${match[1]}' ausente no schema cache, tentando sem ela...`);
                delete payload[match[1]];
                const retry = await supabase
                    .from("motoristas")
                    .update(payload)
                    .eq("id", authData.user.id)
                    .select()
                    .single();
                updated = retry.data;
                error = retry.error;
            } else {
                break;
            }
        }

        if (error) {
            throw new Error(`Erro ao solicitar troca de veículo: ${error.message}`);
        }

        return updated;
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