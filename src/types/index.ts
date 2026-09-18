// src/types/index.ts

export type DriverStatus = 'Pendente' | 'Aprovado' | 'Reprovado' | 'Bloqueado';
export type DriverWorkStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';
export type DriverType = 'EMPRESA' | 'PARTICULAR';
export type PhotoApprovalStatus = 'Aguardando aprovação' | 'Aprovado' | 'Reprovado';
export type DataApprovalStatus = 'Aguardando aprovação' | 'Aprovado' | 'Reprovado';

export interface PersonalData {
    fullName?: string;
    displayName?: string;
    cpf?: string;
    birthDate?: string;
    phone?: string;
    cnh?: string;
    email?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

export interface CompanyData {
    legalName?: string;
    tradeName?: string;
    cnpj?: string;
    stateRegistration?: string;
    phone?: string;
    email?: string;
    representative?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

export type DocumentType = 'CNH' | 'CRLV' | 'PROFILE_PICTURE' | 'PROOF_OF_RESIDENCE';
export type DocumentStatus = 'Pendente' | 'Aprovado' | 'Reprovado';

export type RideStatus =
    | 'IDLE'
    | 'SEARCHING'
    | 'OFFERED'
    | 'ACCEPTED'
    | 'ARRIVED_AT_PICKUP'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
    timestamp?: number;
}

export interface DriverProfile {
    id: string;
    fullName: string;
    displayName?: string;
    cpf: string;
    birthDate?: string;
    phone: string;
    email: string;
    cnh?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    avatarUrl?: string | null;
    validAvatarUrl?: string | null;
    fotoStatus?: PhotoApprovalStatus;
    status: DriverStatus;
    workStatus: DriverWorkStatus;
    driverType?: DriverType;
    rating: number;
    totalRides: number;
    // Dados Pessoais & Fluxo de Análise
    personalDataStatus?: DataApprovalStatus;
    pendingPersonalData?: PersonalData | null;
    personalDataRejectionReason?: string | null;
    // Dados da Empresa & Fluxo de Análise
    companyData?: CompanyData | null;
    companyDataStatus?: DataApprovalStatus;
    pendingCompanyData?: CompanyData | null;
    companyDataRejectionReason?: string | null;
    // Veículo
    vehicle?: {
        make?: string;
        model?: string;
        plate?: string;
        color?: string;
        year?: string | number;
        category?: string;
        status?: 'Pendente' | 'Aprovado' | 'Reprovado';
    };
    vehicleStatus?: 'Pendente' | 'Aprovado' | 'Reprovado';
    role?: string;
    isAdmin?: boolean;
    createdAt: string;
}

export interface Vehicle {
    id: string;
    driverId: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    category: 'POPULAR' | 'COMFORT' | 'EXECUTIVE';
}

export interface DriverDocument {
    id: string;
    driverId: string;
    type: DocumentType;
    fileUrl: string;
    status: DocumentStatus;
    rejectionReason?: string;
    uploadedAt: string;
}

export interface RideOffer {
    id: string;
    passengerName: string;
    passengerRating: number;
    pickupAddress: string;
    pickupLocation: LocationCoordinates;
    dropoffAddress: string;
    dropoffLocation: LocationCoordinates;
    fareAmount: number;
    netFareAmount?: number;
    discountRate?: number;
    isParticular?: boolean;
    paymentMethod?: 'pix' | 'voucher';
    distanceKm: number;
    estimatedMinutes: number;
    expiresInSeconds: number;
    riskAssessment?: {
        isRisk: boolean;
        level: 'low' | 'medium' | 'high';
        reason: string;
        areaName?: string;
        tips?: string[];
    };
    matchesDestinationFilter?: boolean;
}