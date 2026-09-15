export type WorkStatus = 'offline' | 'available' | 'en-route' | 'on-ride' | 'break';

export type RideStatus = 'pending' | 'accepted' | 'arrived' | 'in-progress' | 'completed' | 'cancelled';

export type PaymentMethod = 'pix' | 'voucher';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RideRequest {
  id: string;
  passengerName: string;
  passengerRating: number;
  passengerAccountMonths: number;
  passengerTrips: number;
  pickup: string;
  dropoff: string;
  pickupCoordinates?: Coordinates;
  dropoffCoordinates?: Coordinates;
  distanceKm: number;
  estimatedMinutes: number;
  fare: number;
  paymentMethod: PaymentMethod;
  requestedAt: string;
  source: 'app' | 'integrator';
  riskAssessment?: RiskAssessment;
  matchesDestinationFilter?: boolean;
}

export interface Ride extends RideRequest {
  status: RideStatus;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: 'passenger' | 'driver' | 'admin' | string;
}

export interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id?: string;
  sender_role: 'driver' | 'passenger' | 'system' | 'central';
  sender_name: string;
  content: string;
  created_at: string;
  read?: boolean;
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

export type DriverType = 'EMPRESA' | 'PARTICULAR';

export interface DriverProfile {
  name: string;
  phone: string;
  city: string;
  driverType?: DriverType;
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

export interface DestinationFilter {
  enabled: boolean;
  address: string;
  label?: string; // e.g. "Minha Casa", "Centro", "Trabalho"
  coordinates?: Coordinates;
  maxDeviationKm?: number;
}

export interface RiskAssessment {
  isRisk: boolean;
  level: 'low' | 'medium' | 'high';
  reason: string;
  areaName?: string;
  tips?: string[];
}

export type IncidentType =
  | 'unpaid_fare'
  | 'lost_item'
  | 'inappropriate_behavior'
  | 'vehicle_damage'
  | 'safety_threat'
  | 'route_dispute'
  | 'other';

export interface IncidentReport {
  id: string;
  rideId: string;
  driverId?: string;
  passengerName?: string;
  incidentType: IncidentType;
  description: string;
  amountUnpaid?: number;
  itemDescription?: string;
  evidenceNotes?: string;
  status: 'pending' | 'under_review' | 'resolved';
  createdAt: string;
  protocolNumber?: string;
  resolutionNotes?: string;
}

