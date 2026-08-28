// src/types/index.ts

export type DriverStatus = 'PENDING' | 'IN_ANALYSIS' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type DriverWorkStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';

export type DocumentType = 'CNH' | 'CRLV' | 'PROFILE_PICTURE' | 'PROOF_OF_RESIDENCE';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
    cpf: string;
    phone: string;
    email: string;
    avatarUrl?: string;
    status: DriverStatus;
    workStatus: DriverWorkStatus;
    rating: number;
    totalRides: number;
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