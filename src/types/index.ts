// src/types/index.ts

export type DriverStatus = 'Pendente' | 'Aprovado' | 'Reprovado' | 'Bloqueado';
export type DriverWorkStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';

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
    phone: string;
    email: string;
    avatarUrl?: string | null;
    status: DriverStatus;
    workStatus: DriverWorkStatus;
    rating: number;
    totalRides: number;
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
    distanceKm: number;
    estimatedMinutes: number;
    expiresInSeconds: number;
}