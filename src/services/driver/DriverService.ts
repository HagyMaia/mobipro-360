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

        // 1. Cadastra o perfil do motorista
        const { error: driverError } = await supabase
            .from('motoristas')
            .insert({
                id: userId,
                nome: chosenDisplayName,
                nome_completo: data.fullName,
                nome_social: chosenDisplayName,
                cpf: data.cpf,
                telefone: data.phone,
                email: data.email,
                marca_veiculo: data.vehicleMake,
                modelo_veiculo: data.vehicleModel,
                ano_veiculo: String(data.vehicleYear),
                placa_veiculo: data.vehiclePlate,
                cor_veiculo: data.vehicleColor,
                categoria: data.vehicleCategory,
                status: 'Pendente', // Entra como Pendente por padrão
            });

        if (driverError) throw new Error(`Erro ao cadastrar motorista: ${driverError.message}`);

        // 2. Cadastra o veículo
        const { error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
                driver_id: userId,
                make: data.vehicleMake,
                model: data.vehicleModel,
                year: data.vehicleYear,
                plate: data.vehiclePlate,
                color: data.vehicleColor,
                category: data.vehicleCategory,
            });

        if (vehicleError) throw new Error(`Erro ao cadastrar veículo: ${vehicleError.message}`);

        // 3. Upload dos arquivos e registro na tabela driver_documents
        const docKeys = Object.keys(documents) as DocumentType[];

        for (const docType of docKeys) {
            const file = documents[docType];
            if (file) {
                const fileUrl = await this.uploadDocument(userId, file, docType);

                const { error: docError } = await supabase
                    .from('driver-documents')
                    .insert({
                        driver_id: userId,
                        type: docType,
                        file_url: fileUrl,
                        status: 'PENDING',
                    });

                if (docError) throw new Error(`Erro ao vincular documento ${docType}: ${docError.message}`);
            }
        }
    }
}