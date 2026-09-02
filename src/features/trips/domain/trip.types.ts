export type TripStatus =
  | "SEARCHING_DRIVER"
  | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVING"
  | "DRIVER_ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "CREDIT_CARD";

export interface GeoPoint {
  latitude: number;
  longitude: number;
  address: string;
  neighborhood?: string;
  city?: string;
}

export interface Trip {
  id: string;

  status: TripStatus;

  passengerName: string;

  origin: GeoPoint;

  destination: GeoPoint;

  paymentMethod: PaymentMethod;

  estimatedDistanceMeters: number;

  estimatedDurationSeconds: number;

  estimatedFare: number;

  requestedAt: string;

  driverAssignedAt?: string;

  driverArrivedAt?: string;

  startedAt?: string;

  completedAt?: string;
}