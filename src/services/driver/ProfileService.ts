// src/services/driver/ProfileService.ts

import { createClient } from "@/lib/supabase";

import type {
    DriverProfile,
    DriverStatus,
    DriverWorkStatus,
    DriverType,
    DataApprovalStatus,
    PersonalData,
    CompanyData,
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

    public static normalizePhotoStatus(value: unknown, hasAvatar: boolean): 'Aguardando aprovação' | 'Aprovado' | 'Reprovado' {
        if (!hasAvatar) return 'Aguardando aprovação';
        const raw = String(value ?? '').trim().toLowerCase();
        if (raw.includes('aprov') || raw.includes('approved') || raw.includes('valida') || raw.includes('valid')) {
            return 'Aprovado';
        }
        if (raw.includes('reprov') || raw.includes('rejeit') || raw.includes('recus') || raw.includes('reject')) {
            return 'Reprovado';
        }
        return 'Aguardando aprovação';
    }

    public static normalizeDataStatus(value: unknown): DataApprovalStatus {
        const raw = String(value ?? '').trim().toLowerCase();
        if (raw.includes('reprov') || raw.includes('rejeit') || raw.includes('recus') || raw.includes('reject')) {
            return 'Reprovado';
        }
        if (raw.includes('aguard') || raw.includes('analis') || raw.includes('pend')) {
            return 'Aguardando aprovação';
        }
        return 'Aprovado';
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

        const { data: profile } = await supabase
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

        // Categoria definida exclusivamente pelo administrador (Site / Central)
        // Reconhece categoria_tipo, categoria, tipo_motorista, driver_type e flags de despacho
        const isEmpresa =
            cleanString(p.categoria_tipo, '').toLowerCase() === 'empresa' ||
            cleanString(p.categoria, '').toLowerCase() === 'empresa' ||
            cleanString(p.tipo_motorista, '').toUpperCase() === 'EMPRESA' ||
            cleanString(p.driver_type, '').toUpperCase() === 'EMPRESA' ||
            cleanString(p.perfil_motorista, '').toUpperCase() === 'EMPRESA' ||
            cleanString(p.categoria_motorista, '').toUpperCase() === 'EMPRESA' ||
            (p.recebe_particular === false && p.recebe_voucher === true);

        const driverType: DriverType = isEmpresa ? 'EMPRESA' : 'PARTICULAR';

        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('mobipro_driver_type', driverType);
                window.dispatchEvent(new CustomEvent('mobipro_driver_type_changed', { detail: { driverType } }));
                window.dispatchEvent(new CustomEvent('mobipro_driver_type_changed', { detail: driverType }));
            } catch {}
        }

        const rawAvatar = p.avatar_url ?? null;
        const fotoStatus = this.normalizePhotoStatus(p.foto_status || p.avatar_status, Boolean(rawAvatar));
        const validAvatarUrl = fotoStatus === 'Aprovado' ? rawAvatar : null;

        // Status de Análise de Dados Pessoais
        const personalDataStatus = this.normalizeDataStatus(p.dados_pessoais_status || p.personal_data_status);
        let pendingPersonalData: PersonalData | null = null;
        if (p.pending_personal_data) {
            try {
                pendingPersonalData = typeof p.pending_personal_data === 'string'
                    ? JSON.parse(p.pending_personal_data)
                    : p.pending_personal_data;
            } catch {}
        }

        // Status de Análise de Dados da Empresa
        const companyDataStatus = this.normalizeDataStatus(p.dados_empresa_status || p.company_data_status);
        let pendingCompanyData: CompanyData | null = null;
        if (p.pending_company_data) {
            try {
                pendingCompanyData = typeof p.pending_company_data === 'string'
                    ? JSON.parse(p.pending_company_data)
                    : p.pending_company_data;
            } catch {}
        }

        const companyData: CompanyData = {
            legalName: cleanString(p.empresa_razao_social, cleanString(p.razao_social, '')),
            tradeName: cleanString(p.empresa_nome_fantasia, cleanString(p.nome_fantasia, '')),
            cnpj: cleanString(p.empresa_cnpj, cleanString(p.cnpj, '')),
            stateRegistration: cleanString(p.empresa_inscricao_estadual, cleanString(p.inscricao_estadual, '')),
            phone: cleanString(p.empresa_telefone, ''),
            email: cleanString(p.empresa_email, ''),
            representative: cleanString(p.empresa_responsavel, ''),
            zipCode: cleanString(p.empresa_cep, ''),
            street: cleanString(p.empresa_endereco, ''),
            number: cleanString(p.empresa_numero, ''),
            neighborhood: cleanString(p.empresa_bairro, ''),
            city: cleanString(p.empresa_cidade, 'Manaus'),
            state: cleanString(p.empresa_estado, 'AM'),
        };

        return {
            id: p.id,
            fullName: cleanString(p.nome_completo, cleanString(p.nome, resolvedName)),
            displayName: resolvedName,
            cpf: cleanString(p.cpf, ''),
            birthDate: cleanString(p.data_nascimento, cleanString(p.birth_date, '')),
            phone: cleanString(p.telefone, cleanString(p.phone, '')),
            cnh: cleanString(p.cnh, ''),
            email: cleanString(p.email, authData.user.email ?? ''),
            zipCode: cleanString(p.cep, cleanString(p.zip_code, '')),
            street: cleanString(p.rua, cleanString(p.street, '')),
            number: cleanString(p.numero, cleanString(p.number, '')),
            complement: cleanString(p.complemento, cleanString(p.complement, '')),
            neighborhood: cleanString(p.bairro, cleanString(p.neighborhood, '')),
            city: cleanString(p.cidade, cleanString(p.city, 'Manaus')),
            state: cleanString(p.estado, cleanString(p.state, 'AM')),
            avatarUrl: rawAvatar,
            validAvatarUrl,
            fotoStatus,
            status: this.normalizeDriverStatus(p.status),
            workStatus: p.work_status ?? "OFFLINE",
            driverType,
            rating: Number(p.rating ?? 4.95),
            totalRides: Number(p.total_rides ?? 128),
            role: rawRole || (isAdmin ? 'admin' : 'motorista'),
            isAdmin,
            // Dados Pessoais & Aprovação
            personalDataStatus,
            pendingPersonalData,
            personalDataRejectionReason: p.personal_data_rejection_reason || null,
            // Dados da Empresa & Aprovação
            companyData,
            companyDataStatus,
            pendingCompanyData,
            companyDataRejectionReason: p.company_data_rejection_reason || null,
            // Veículo
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
     * Define o tipo/perfil do motorista exclusivamente via painel de administração (EMPRESA ou PARTICULAR)
     */
    public static async setDriverTypeByAdmin(driverId: string, driverType: 'EMPRESA' | 'PARTICULAR') {
        const supabase = createClient();
        const isEmpresa = driverType === 'EMPRESA';
        const updates: Record<string, any> = {
            categoria_tipo: isEmpresa ? 'empresa' : 'particular',
            categoria: isEmpresa ? 'Empresa' : 'Particular',
            recebe_voucher: true,
            recebe_particular: !isEmpresa,
            tipo_motorista: driverType,
            driver_type: driverType,
            perfil_motorista: driverType,
            categoria_motorista: driverType,
            updated_at: new Date().toISOString()
        };

        let { error: mError } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", driverId);

        if (mError) {
            let attempts = 0;
            while (mError && attempts < 6) {
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

        return updates;
    }

    /**
     * Envia solicitação de alteração de Dados Pessoais do motorista para análise do administrador.
     * Os dados oficiais permanecem inalterados até a aprovação.
     */
    public static async requestPersonalDataChange(data: PersonalData) {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            throw new Error(authError?.message ?? "Usuário não autenticado.");
        }

        const updates: Record<string, any> = {
            pending_personal_data: data,
            dados_pessoais_status: 'Aguardando aprovação',
            personal_data_status: 'Aguardando aprovação',
            personal_data_rejection_reason: null,
            updated_at: new Date().toISOString(),
        };

        let { data: updated, error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id)
            .select()
            .maybeSingle();

        if (error) {
            console.warn('[ProfileService] Falha ao enviar análise de dados pessoais para motoristas, tentando drivers:', error);
            const retry = await supabase
                .from("drivers")
                .update(updates)
                .eq("id", authData.user.id)
                .select()
                .maybeSingle();
            updated = retry.data;
            if (retry.error) {
                throw new Error(`Erro ao enviar solicitação: ${retry.error.message}`);
            }
        }

        return updated;
    }

    /**
     * Envia solicitação de alteração de Dados da Empresa para análise do administrador.
     * Os dados oficiais da empresa permanecem inalterados até a aprovação.
     */
    public static async requestCompanyDataChange(data: CompanyData) {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
            throw new Error(authError?.message ?? "Usuário não autenticado.");
        }

        const updates: Record<string, any> = {
            pending_company_data: data,
            dados_empresa_status: 'Aguardando aprovação',
            company_data_status: 'Aguardando aprovação',
            company_data_rejection_reason: null,
            updated_at: new Date().toISOString(),
        };

        let { data: updated, error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id)
            .select()
            .maybeSingle();

        if (error) {
            console.warn('[ProfileService] Falha ao enviar análise de dados de empresa para motoristas, tentando drivers:', error);
            const retry = await supabase
                .from("drivers")
                .update(updates)
                .eq("id", authData.user.id)
                .select()
                .maybeSingle();
            updated = retry.data;
            if (retry.error) {
                throw new Error(`Erro ao enviar solicitação da empresa: ${retry.error.message}`);
            }
        }

        return updated;
    }

    /**
     * Aprova a alteração de dados pessoais pelo administrador e efetiva os dados oficiais.
     */
    public static async approvePersonalDataByAdmin(driverId: string, pendingData?: PersonalData) {
        const supabase = createClient();

        let dataToApply = pendingData;
        if (!dataToApply) {
            const { data: currentDriver } = await supabase
                .from("motoristas")
                .select("pending_personal_data")
                .eq("id", driverId)
                .maybeSingle();

            if (currentDriver?.pending_personal_data) {
                dataToApply = typeof currentDriver.pending_personal_data === 'string'
                    ? JSON.parse(currentDriver.pending_personal_data)
                    : currentDriver.pending_personal_data;
            }
        }

        if (!dataToApply) {
            throw new Error("Nenhum dado pendente encontrado para aprovação.");
        }

        const updates: Record<string, any> = {
            dados_pessoais_status: 'Aprovado',
            personal_data_status: 'Aprovado',
            pending_personal_data: null,
            personal_data_rejection_reason: null,
            updated_at: new Date().toISOString(),
        };

        if (dataToApply.fullName) {
            updates.nome_completo = dataToApply.fullName;
            if (!dataToApply.displayName) {
                updates.nome = dataToApply.fullName;
                updates.nome_social = dataToApply.fullName;
            }
        }
        if (dataToApply.displayName) {
            updates.nome = dataToApply.displayName;
            updates.nome_social = dataToApply.displayName;
        }
        if (dataToApply.cpf) updates.cpf = dataToApply.cpf;
        if (dataToApply.birthDate) updates.data_nascimento = dataToApply.birthDate;
        if (dataToApply.phone) {
            updates.telefone = dataToApply.phone;
            updates.phone = dataToApply.phone;
        }
        if (dataToApply.cnh) updates.cnh = dataToApply.cnh;
        if (dataToApply.zipCode) updates.cep = dataToApply.zipCode;
        if (dataToApply.street) updates.rua = dataToApply.street;
        if (dataToApply.number) updates.numero = dataToApply.number;
        if (dataToApply.complement) updates.complemento = dataToApply.complement;
        if (dataToApply.neighborhood) updates.bairro = dataToApply.neighborhood;
        if (dataToApply.city) updates.cidade = dataToApply.city;
        if (dataToApply.state) updates.estado = dataToApply.state;

        let { error } = await supabase.from("motoristas").update(updates).eq("id", driverId);
        if (error) {
            console.warn('[ProfileService] Falha ao aprovar dados pessoais em motoristas, tentando drivers:', error);
            await supabase.from("drivers").update(updates).eq("id", driverId);
        }

        return updates;
    }

    /**
     * Rejeita a alteração de dados pessoais pelo administrador.
     */
    public static async rejectPersonalDataByAdmin(driverId: string, reason?: string) {
        const supabase = createClient();
        const updates: Record<string, any> = {
            dados_pessoais_status: 'Reprovado',
            personal_data_status: 'Reprovado',
            personal_data_rejection_reason: reason || 'Dados pessoais rejeitados pela moderação.',
            updated_at: new Date().toISOString(),
        };

        let { error } = await supabase.from("motoristas").update(updates).eq("id", driverId);
        if (error) {
            await supabase.from("drivers").update(updates).eq("id", driverId);
        }

        return updates;
    }

    /**
     * Aprova a alteração de dados da empresa pelo administrador e efetiva os dados oficiais.
     */
    public static async approveCompanyDataByAdmin(driverId: string, pendingData?: CompanyData) {
        const supabase = createClient();

        let dataToApply = pendingData;
        if (!dataToApply) {
            const { data: currentDriver } = await supabase
                .from("motoristas")
                .select("pending_company_data")
                .eq("id", driverId)
                .maybeSingle();

            if (currentDriver?.pending_company_data) {
                dataToApply = typeof currentDriver.pending_company_data === 'string'
                    ? JSON.parse(currentDriver.pending_company_data)
                    : currentDriver.pending_company_data;
            }
        }

        if (!dataToApply) {
            throw new Error("Nenhum dado pendente de empresa encontrado para aprovação.");
        }

        const updates: Record<string, any> = {
            dados_empresa_status: 'Aprovado',
            company_data_status: 'Aprovado',
            pending_company_data: null,
            company_data_rejection_reason: null,
            updated_at: new Date().toISOString(),
        };

        if (dataToApply.legalName) updates.empresa_razao_social = dataToApply.legalName;
        if (dataToApply.tradeName) updates.empresa_nome_fantasia = dataToApply.tradeName;
        if (dataToApply.cnpj) updates.empresa_cnpj = dataToApply.cnpj;
        if (dataToApply.stateRegistration) updates.empresa_inscricao_estadual = dataToApply.stateRegistration;
        if (dataToApply.phone) updates.empresa_telefone = dataToApply.phone;
        if (dataToApply.email) updates.empresa_email = dataToApply.email;
        if (dataToApply.representative) updates.empresa_responsavel = dataToApply.representative;
        if (dataToApply.zipCode) updates.empresa_cep = dataToApply.zipCode;
        if (dataToApply.street) updates.empresa_endereco = dataToApply.street;
        if (dataToApply.number) updates.empresa_numero = dataToApply.number;
        if (dataToApply.neighborhood) updates.empresa_bairro = dataToApply.neighborhood;
        if (dataToApply.city) updates.empresa_cidade = dataToApply.city;
        if (dataToApply.state) updates.empresa_estado = dataToApply.state;

        let { error } = await supabase.from("motoristas").update(updates).eq("id", driverId);
        if (error) {
            console.warn('[ProfileService] Falha ao aprovar dados de empresa em motoristas, tentando drivers:', error);
            await supabase.from("drivers").update(updates).eq("id", driverId);
        }

        return updates;
    }

    /**
     * Rejeita a alteração de dados da empresa pelo administrador.
     */
    public static async rejectCompanyDataByAdmin(driverId: string, reason?: string) {
        const supabase = createClient();
        const updates: Record<string, any> = {
            dados_empresa_status: 'Reprovado',
            company_data_status: 'Reprovado',
            company_data_rejection_reason: reason || 'Dados da empresa rejeitados pela moderação.',
            updated_at: new Date().toISOString(),
        };

        let { error } = await supabase.from("motoristas").update(updates).eq("id", driverId);
        if (error) {
            await supabase.from("drivers").update(updates).eq("id", driverId);
        }

        return updates;
    }

    /**
     * Atualiza o status de aprovação da foto do motorista pelo administrador ('Aprovado' ou 'Reprovado')
     */
    public static async updateDriverPhotoStatusByAdmin(
        driverId: string,
        status: 'Aprovado' | 'Reprovado'
    ) {
        const supabase = createClient();

        let updates: Record<string, any> = {
            foto_status: status,
            avatar_status: status,
            updated_at: new Date().toISOString(),
        };

        if (status === 'Aprovado') {
            const { data: driver } = await supabase
                .from("motoristas")
                .select("pending_avatar_url, avatar_url")
                .eq("id", driverId)
                .maybeSingle();

            if (driver?.pending_avatar_url) {
                updates.avatar_url = driver.pending_avatar_url;
                updates.approved_avatar_url = driver.pending_avatar_url;
            }
        }

        let { error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", driverId);

        if (error) {
            console.warn('[ProfileService] Erro ao atualizar status da foto no motoristas, tentando drivers:', error);
            await supabase
                .from("drivers")
                .update(updates)
                .eq("id", driverId);
        }

        return status;
    }

    /**
     * Atualiza o avatar ou dados rápidos do perfil
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
            return {
                id: 'local',
                nome: data.displayName,
                nome_completo: data.fullName,
                telefone: data.phone,
                avatar_url: data.avatarUrl,
                foto_status: 'Aguardando aprovação',
            };
        }

        const updates: Record<string, any> = {};
        if (data.avatarUrl !== undefined) {
            updates.avatar_url = data.avatarUrl;
            updates.pending_avatar_url = data.avatarUrl;
            updates.foto_status = 'Aguardando aprovação';
            updates.avatar_status = 'Aguardando aprovação';
        }

        if (Object.keys(updates).length === 0) {
            return null;
        }

        let { data: updated, error } = await supabase
            .from("motoristas")
            .update(updates)
            .eq("id", authData.user.id)
            .select()
            .maybeSingle();

        if (error || !updated) {
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
            vehicle_status: 'Pendente',
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