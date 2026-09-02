import type { TripStatus } from "./trip.types";

const allowedTransitions: Record<TripStatus, TripStatus[]> = {
  SEARCHING_DRIVER: [
    "DRIVER_ASSIGNED",
  ],

  DRIVER_ASSIGNED: [
    "DRIVER_ARRIVING",
  ],

  DRIVER_ARRIVING: [
    "DRIVER_ARRIVED",
  ],

  DRIVER_ARRIVED: [
    "IN_PROGRESS",
  ],

  IN_PROGRESS: [
    "COMPLETED",
  ],

  COMPLETED: [],
};

export function canChangeTripStatus(
  currentStatus: TripStatus,
  nextStatus: TripStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function validateTripStatusChange(
  currentStatus: TripStatus,
  nextStatus: TripStatus,
): void {
  const isAllowed = canChangeTripStatus(
    currentStatus,
    nextStatus,
  );

  if (!isAllowed) {
    throw new Error(
      `Status invalido: ${currentStatus} -> ${nextStatus}`,
    );
  }
}