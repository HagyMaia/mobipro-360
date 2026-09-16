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
            .maybeSingle();

        let finalProfile = profile;
        if (!finalProfile) {
            const { data: dProfile } = await supabase
                .from('drivers')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();
            finalProfile = dProfile;
        }

        if (!finalProfile) {
            return null;
        }

        const p = finalProfile;
        const rawName = cleanString(p.nome_social, cleanString(p.nome, ''));
        const resolvedName = rawName || (p.email ? p.email.split('@')[0] : 'Motorista');

        const make = cleanString(p.marca_veiculo, cleanString(p.vehicle_make, 'Chevrolet'));
        const model = cleanString(p.modelo_veiculo, cleanString(p.vehicle_model, 'Onix Plus'));
        const plate = cleanString(p.placa_veiculo, cleanString(p.vehicle_plate, 'ABC1D23'));
        const color = cleanString(p.cor_veiculo, cleanString(p.vehicle_color, 'Prata'));
        const year = cleanString(p.ano_veiculo, cleanString(p.vehicle_year, '2024'));
        const category = cleanString(p.categoria, 'POPULAR');
        const vStatus = cleanString(p.vehicle_status, 'Aprovado') as 'Aprovado' | 'Pendente' | 'Reprovado';

        const rawRole = cleanString(
            p.role,
            cleanString(p.tipo, cleanString(p.perfil, cleanString(p.user_role, '')))
        );
        const userEmail = (authData.user.email ?? '').toLowerCase();
        const isAdmin =
            rawRole.toLowerCase() === 'admin' ||
            rawRole.toLowerCase() === 'administrador' ||
            p.is_admin === true ||
            p.is_admin === 'true' ||
            p.admin === true ||
            userEmail === 'hagy.maia19@gmail.com' ||
            userEmail.startsWith('admin@') ||
            authData.user.user_metadata?.role === 'admin' ||
            authData.user.user_metadata?.is_admin === true ||
            authData.user.app_metadata?.role === 'admin' ||
            authData.user.app_metadata?.claims_admin === true;

        const rawDriverType = cleanString(
            p.driver_type,
            cleanString(
                p.tipo_motorista,
                cleanString(
                    p.perfil_motorista,
                    typeof window !== 'undefined' ? (window.localStorage.getItem('mobipro_driver_type') || 'PARTICULAR') : 'PARTICULAR'
                )
            )
        ).toUpperCase();
        const driverType: 'EMPRESA' | 'PARTICULAR' = rawDriverType === 'EMPRESA' ? 'EMPRESA' : 'PARTICULAR';

        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('mobipro_driver_type', driverType);
            } catch {}
        }

        return {
            id: p.id,
            fullName: cleanString(p.nome_completo, cleanString(p.nome, resolvedName)),
            displayName: resolvedName,
            cpf: cleanString(p.cpf, ''),
            phone: cleanString(p.telefone, cleanString(p.phone, '')),
            email: cleanString(p.email, authData.user.email ?? ''),
            avatarUrl: p.avatar_url ?? null,
            status: this.normalizeDriverStatus(p.status),
            workStatus: p.work_status ?? "OFFLINE",
            driverType,
            rating: Number(p.rating ?? 4.95),
            totalRides: Number(p.total_rides ?? 128),
            role: rawRole || (isAdmin ? 'admin' : 'motorista'),
            isAdmin,
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
            createdAt: p.created_at || new Date().toISOString(),
        };
    }

    /**
     * Atualiza o tipo/perfil do motorista (EMPRESA ou PARTICULAR)
     */
    public static async updateDriverType(driverType: 'EMPRESA' | 'PARTICULAR') {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('mobipro_driver_type', driverType);
                window.dispatchEvent(new CustomEvent('mobipro_driver_type_changed', { detail: driverType }));
            } catch {}
        }

        if (authError || !authData.user) {
            return driverType;
        }

        const updates: Record<string, any> = {
            tipo_motorista: driverType,
            driver_type: driverType,
            perfil_motorista: driverType,
            updated_at: new Date().toISOString()
        };

        let { error: mError } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id);

        if (mError) {
            let attempts = 0;
            while (mError && attempts < 4) {
                attempts++;
                const msg = mError.message || '';
                const match =
                    msg.match(/Could not find the '([^']+)' column/i) ||
                    msg.match(/column "([^"]+)" of relation/i) ||
                    msg.match(/column "([^"]+)" does not exist/i);

                if (match && match[1] && updates[match[1]] !== undefined) {
                    delete updates[match[1]];
                    const retry = await supabase.from("motoristas").update(updates).eq("id", authData.user.id);
                    mError = retry.error;
                } else {
                    break;
                }
            }
        }

        if (mError) {
            console.warn('[ProfileService] Erro ao atualizar tipo no motoristas, tentando drivers:', mError);
            await supabase
                .from("drivers")
                .update(updates)
                .eq("id", authData.user.id);
        }

        return driverType;
    }

    /**
     * Define o tipo/perfil do motorista exclusivamente via painel de administração (EMPRESA ou PARTICULAR)
     */
    public static async setDriverTypeByAdmin(driverId: string, driverType: 'EMPRESA' | 'PARTICULAR') {
        const supabase = createClient();
        const updates: Record<string, any> = {
            tipo_motorista: driverType,
            driver_type: driverType,
            perfil_motorista: driverType,
            updated_at: new Date().toISOString()
        };

        let { error: mError } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", driverId);

        if (mError) {
            let attempts = 0;
            while (mError && attempts < 4) {
                attempts++;
                const msg = mError.message || '';
                const match =
                    msg.match(/Could not find the '([^']+)' column/i) ||
                    msg.match(/column "([^"]+)" of relation/i) ||
                    msg.match(/column "([^"]+)" does not exist/i);

                if (match && match[1] && updates[match[1]] !== undefined) {
                    delete updates[match[1]];
                    const retry = await supabase.from("motoristas").update(updates).eq("id", driverId);
                    mError = retry.error;
                } else {
                    break;
                }
            }
        }

        if (mError) {
            console.warn('[ProfileService] Erro ao atualizar tipo no motoristas via admin, tentando tabela drivers:', mError);
            await supabase
                .from("drivers")
                .update(updates)
                .eq("id", driverId);
        }

        return driverType;
    }

    /**
     * Atualiza as informações pessoais do motorista (nome de exibição, telefone, avatar, tipo de motorista)
     */
    public static async updateProfile(data: {
        displayName?: string;
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
        driverType?: 'EMPRESA' | 'PARTICULAR';
    }) {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (data.driverType && typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('mobipro_driver_type', data.driverType);
                window.dispatchEvent(new CustomEvent('mobipro_driver_type_changed', { detail: data.driverType }));
            } catch {}
        }

        if (authError || !authData.user) {
            return {
                id: 'local',
                nome: data.displayName,
                nome_completo: data.fullName,
                telefone: data.phone,
                avatar_url: data.avatarUrl,
                driver_type: data.driverType,
            };
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
        if (data.driverType !== undefined) {
            updates.tipo_motorista = data.driverType;
            updates.driver_type = data.driverType;
            updates.perfil_motorista = data.driverType;
        }

        let { data: updated, error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id)
            .select()
            .maybeSingle();

        if (error) {
            let attempts = 0;
            while (error && attempts < 4) {
                attempts++;
                const msg = error.message || '';
                const match =
                    msg.match(/Could not find the '([^']+)' column/i) ||
                    msg.match(/column "([^"]+)" of relation/i) ||
                    msg.match(/column "([^"]+)" does not exist/i);

                if (match && match[1] && updates[match[1]] !== undefined) {
                    delete updates[match[1]];
                    const retry = await supabase.from("motoristas").update(updates).eq("id", authData.user.id).select().maybeSingle();
                    error = retry.error;
                    updated = retry.data;
                } else {
                    break;
                }
            }
        }

        if (error || !updated) {
            console.warn('[ProfileService] Falha ao atualizar em motoristas, tentando drivers:', error);
            const { data: dUpdated } = await supabase
                .from("drivers")
                .update(updates)
                .eq("id", authData.user.id)
                .select()
                .maybeSingle();
            updated = dUpdated;
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