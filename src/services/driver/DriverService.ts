// src/services/driver/DriverService.ts

import { createClient } from '@/lib/supabase';
import { DocumentType } from '@/types';

export interface DriverRegistrationData {
    // Passos 1 & 2
    fullName: string;
    displayName?: string;
    cpf: string;
    phone: string;
    email: string;
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    // Passo 4 - Veículo
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    vehiclePlate: string;
    vehicleColor: string;
    vehicleCategory: 'POPULAR' | 'COMFORT' | 'EXECUTIVE';
}

export class DriverService {
    /**
     * Upload de arquivo para o Supabase Storage na pasta privada do motorista
     */
    public static async uploadDocument(
        userId: string,
        file: File,
        docType: DocumentType
    ): Promise<string> {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${docType}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('driver-documents')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            throw new Error(`Erro ao enviar ${docType}: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('driver-documents')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Submete o cadastro completo dos 5 passos para o banco de dados
     */
    public static async registerDriver(
        userId: string,
        data: DriverRegistrationData,
        documents: Record<DocumentType, File>
    ): Promise<void> {
        const supabase = createClient();

        const chosenDisplayName = data.displayName?.trim() || data.fullName.trim().split(' ')[0] || 'Motorista';

        // 1. Cadastra ou atualiza o perfil do motorista (upsert evita conflito se usuário já iniciou processo)
        const safeCpf = data.cpf?.trim() || '';
        const safePhone = data.phone?.trim() || '';
        const safeCnh = safeCpf || safePhone || 'PENDENTE';

        let driverPayload: Record<string, any> = {
            id: userId,
            nome: chosenDisplayName,
            nome_completo: data.fullName?.trim() || chosenDisplayName,
            nome_social: chosenDisplayName,
            cpf: safeCpf,
            cnh: safeCnh,
            telefone: safePhone,
            phone: safePhone,
            email: data.email?.trim() || '',
            marca_veiculo: data.vehicleMake?.trim() || 'Chevrolet',
            modelo_veiculo: data.vehicleModel?.trim() || 'Onix Plus',
            ano_veiculo: String(data.vehicleYear || 2024),
            placa_veiculo: data.vehiclePlate?.trim() || 'ABC1D23',
            cor_veiculo: data.vehicleColor?.trim() || 'Prata',
            categoria: data.vehicleCategory || 'POPULAR',
            status: 'Pendente', // Entra como Pendente por padrão
        };

        let { error: driverError } = await supabase
            .from('motoristas')
            .upsert(driverPayload, { onConflict: 'id' });

        let attempts = 0;
        while (driverError && attempts < 5) {
            attempts++;
            const match = driverError.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1] && driverPayload[match[1]] !== undefined) {
                console.warn(`[DriverService] Coluna '${match[1]}' ausente no schema cache, tentando sem ela...`);
                delete driverPayload[match[1]];
                const retry = await supabase
                    .from('motoristas')
                    .upsert(driverPayload, { onConflict: 'id' });
                driverError = retry.error;
            } else {
                break;
            }
        }

        if (driverError) {
            console.error('[DriverService] Erro definitivo ao cadastrar motorista:', driverError);
            throw new Error(`Erro ao cadastrar motorista: ${driverError.message}`);
        }

        // 2. Cadastra o veículo na tabela auxiliar 'vehicles' (se existir)
        try {
            const { error: vehicleError } = await supabase
                .from('vehicles')
                .upsert(
                    {
                        driver_id: userId,
                        make: data.vehicleMake,
                        model: data.vehicleModel,
                        year: data.vehicleYear,
                        plate: data.vehiclePlate,
                        color: data.vehicleColor,
                        category: data.vehicleCategory,
                    },
                    { onConflict: 'driver_id' }
                );

            if (vehicleError) {
                console.warn('[DriverService] Aviso ao cadastrar veículo na tabela auxiliar:', vehicleError.message);
            }
        } catch (vErr) {
            console.warn('[DriverService] Tabela vehicles não acessível:', vErr);
        }

        // 3. Upload dos arquivos e registro na tabela driver-documents
        const docKeys = Object.keys(documents) as DocumentType[];

        for (const docType of docKeys) {
            const file = documents[docType];
            if (file) {
                try {
                    const fileUrl = await this.uploadDocument(userId, file, docType);

                    const { error: docError } = await supabase
                        .from('driver_documents')
                        .insert({
                            driver_id: userId,
                            type: docType,
                            file_url: fileUrl,
                            status: 'PENDING',
                        });

                    if (docError) {
                        console.warn(`[DriverService] Aviso ao registrar documento ${docType}:`, docError.message);
                    }
                } catch (docErr: any) {
                    console.warn(`[DriverService] Falha no upload/registro do documento ${docType}:`, docErr?.message || docErr);
                }
            }
        }
    }
}