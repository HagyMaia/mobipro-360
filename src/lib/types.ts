export type DriverStatus = 'offline' | 'available' | 'en-route' | 'on-ride' | 'break';

export type RideStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';

export type PaymentMethod = 'pix' | 'card' | 'cash';

export interface RideRequest {
  id: string;
  passengerName: string;
  passengerRating: number;
  passengerAccountMonths: number;
  passengerTrips: number;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  estimatedMinutes: number;
  fare: number;
  paymentMethod: PaymentMethod;
  requestedAt: string;
  source: 'app' | 'integrator';
}

export interface Ride extends RideRequest {
  status: RideStatus;
  startedAt?: string;
  completedAt?: string;
}

export type ExpenseCategory = 'combustivel' | 'alimentacao' | 'lavagem' | 'manutencao' | 'outros';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
}

export interface Earning {
  id: string;
  amount: number;
  date: string;
  source: 'ride' | 'manual';
  note: string;
}

export interface HeatZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  radiusKm: number;
  avgFare: number;
  events?: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface DriverProfile {
  name: string;
  phone: string;
  city: string;
  rating: number;
  totalRides: number;
  vehicle: {
    model: string;
    plate: string;
    color: string;
    year: number;
  };
  license: string;
}

export interface PassengerFilters {
  minRating: number;
  minAccountMonths: number;
  rejectCash: boolean;
  autoReject: boolean;
}
