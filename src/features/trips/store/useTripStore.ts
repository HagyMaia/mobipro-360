import { create } from "zustand";

import {
  validateTripStatusChange,
} from "../domain/trip.machine";

import type {
  Trip,
  TripStatus,
} from "../domain/trip.types";

interface TripStore {
  currentTrip: Trip | null;

  setCurrentTrip: (trip: Trip | null) => void;

  changeTripStatus: (
    nextStatus: TripStatus,
  ) => void;

  clearTrip: () => void;
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTrip: null,

  setCurrentTrip: (trip) => {
    set({
      currentTrip: trip,
    });
  },

  changeTripStatus: (nextStatus) => {
    const currentTrip = get().currentTrip;

    if (!currentTrip) {
      throw new Error("Nao existe corrida ativa.");
    }

    validateTripStatusChange(
      currentTrip.status,
      nextStatus,
    );

    const now = new Date().toISOString();

    set({
      currentTrip: {
        ...currentTrip,
        status: nextStatus,

        driverAssignedAt:
          nextStatus === "DRIVER_ASSIGNED"
            ? now
            : currentTrip.driverAssignedAt,

        driverArrivedAt:
          nextStatus === "DRIVER_ARRIVED"
            ? now
            : currentTrip.driverArrivedAt,

        startedAt:
          nextStatus === "IN_PROGRESS"
            ? now
            : currentTrip.startedAt,

        completedAt:
          nextStatus === "COMPLETED"
            ? now
            : currentTrip.completedAt,
      },
    });
  },

  clearTrip: () => {
    set({
      currentTrip: null,
    });
  },
}));