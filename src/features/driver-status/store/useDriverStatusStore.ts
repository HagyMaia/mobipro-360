import { create } from "zustand";

export type DriverAvailabilityStatus =
  | "OFFLINE"
  | "ONLINE"
  | "PAUSED"
  | "IN_TRIP";

interface DriverStatusStore {
  status: DriverAvailabilityStatus;

  setStatus: (status: DriverAvailabilityStatus) => void;

  goOnline: () => void;
  goOffline: () => void;
  pause: () => void;
  startTrip: () => void;
}

export const useDriverStatusStore = create<DriverStatusStore>((set) => ({
  status: "OFFLINE",

  setStatus: (status) => {
    set({ status });
  },

  goOnline: () => {
    set({ status: "ONLINE" });
  },

  goOffline: () => {
    set({ status: "OFFLINE" });
  },

  pause: () => {
    set({ status: "PAUSED" });
  },

  startTrip: () => {
    set({ status: "IN_TRIP" });
  },
}));