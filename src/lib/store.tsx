'use client';

import type { NavApp } from './navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode
} from 'react';
import type {
  DriverProfile,
  DriverStatus,
  EmergencyContact,
  Earning,
  Expense,
  PassengerFilters,
  Ride,
  RideRequest
} from './types';
import {
  DEFAULT_CONTACTS,
  DEFAULT_FILTERS,
  DEFAULT_PROFILE,
  SEED_EXPENSES
} from './mock-data';
import { isToday, uid } from './utils';

const STORAGE_KEY = 'srlogistica_state_v1';

export interface AppState {
  status: DriverStatus;
  incomingRide: RideRequest | null;
  activeRide: Ride | null;
  rideHistory: Ride[];
  expenses: Expense[];
  earnings: Earning[];
  goalTarget: number;
  contacts: EmergencyContact[];
  filters: PassengerFilters;
  profile: DriverProfile;
  navApp: NavApp;
}

type Action =
  | { type: 'SET_STATUS'; status: DriverStatus }
  | { type: 'NEW_RIDE_REQUEST'; ride: RideRequest }
  | { type: 'ACCEPT_RIDE' }
  | { type: 'START_RIDE' }
  | { type: 'COMPLETE_RIDE' }
  | { type: 'CANCEL_RIDE' }
  | { type: 'REJECT_RIDE' }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'REMOVE_EXPENSE'; id: string }
  | { type: 'ADD_EARNING'; earning: Earning }
  | { type: 'SET_GOAL'; target: number }
  | { type: 'ADD_CONTACT'; contact: EmergencyContact }
  | { type: 'REMOVE_CONTACT'; id: string }
  | { type: 'UPDATE_FILTERS'; filters: PassengerFilters }
  | { type: 'UPDATE_PROFILE'; profile: DriverProfile }
  | { type: 'SET_NAV_APP'; navApp: NavApp }
  | { type: 'HYDRATE'; state: AppState };

const DEFAULT_STATE: AppState = {
  status: 'offline',
  incomingRide: null,
  activeRide: null,
  rideHistory: [],
  expenses: SEED_EXPENSES,
  earnings: [],
  goalTarget: 300,
  contacts: DEFAULT_CONTACTS,
  filters: DEFAULT_FILTERS,
  profile: DEFAULT_PROFILE,
  navApp: 'waze'
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };

    case 'NEW_RIDE_REQUEST':
      if (state.status !== 'available') return state;
      return { ...state, incomingRide: action.ride };

    case 'ACCEPT_RIDE': {
      const ride = state.incomingRide;
      if (!ride) return state;
      const active: Ride = { ...ride, status: 'accepted' };
      return {
        ...state,
        incomingRide: null,
        activeRide: active,
        status: 'en-route'
      };
    }

    case 'START_RIDE': {
      if (!state.activeRide) return state;
      return {
        ...state,
        activeRide: { ...state.activeRide, status: 'in-progress', startedAt: new Date().toISOString() },
        status: 'on-ride'
      };
    }

    case 'COMPLETE_RIDE': {
      if (!state.activeRide) return state;
      const completed: Ride = {
        ...state.activeRide,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      const earning: Earning = {
        id: uid('earn'),
        amount: completed.fare,
        date: new Date().toISOString().slice(0, 10),
        source: 'ride',
        note: `${completed.passengerName} · ${completed.pickup} → ${completed.dropoff}`
      };
      return {
        ...state,
        activeRide: null,
        rideHistory: [completed, ...state.rideHistory],
        earnings: [earning, ...state.earnings],
        status: 'available'
      };
    }

    case 'CANCEL_RIDE': {
      if (!state.activeRide) return state;
      const cancelled: Ride = { ...state.activeRide, status: 'cancelled' };
      return {
        ...state,
        activeRide: null,
        rideHistory: [cancelled, ...state.rideHistory],
        status: 'available'
      };
    }

    case 'REJECT_RIDE':
      return { ...state, incomingRide: null };

    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };

    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };

    case 'ADD_EARNING':
      return { ...state, earnings: [action.earning, ...state.earnings] };

    case 'SET_GOAL':
      return { ...state, goalTarget: action.target };

    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.contact] };

    case 'REMOVE_CONTACT':
      return { ...state, contacts: state.contacts.filter((c) => c.id !== action.id) };

    case 'UPDATE_FILTERS':
      return { ...state, filters: action.filters };

    case 'UPDATE_PROFILE':
      return { ...state, profile: action.profile };

    case 'SET_NAV_APP':
      return { ...state, navApp: action.navApp };

    case 'HYDRATE':
      return { ...action.state, incomingRide: null, activeRide: null };

    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  todayEarnings: number;
  todayExpenses: number;
  todayNet: number;
  goalProgress: number;
  todayRides: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  useEffect(() => {
    const hydrated = loadState();
    dispatch({ type: 'HYDRATE', state: hydrated });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage indisponível (modo privado etc.)
    }
  }, [state]);

  const value = useMemo<StoreContextValue>(() => {
    const todayEarnings = state.earnings
      .filter((e) => isToday(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = state.expenses
      .filter((e) => isToday(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
    const todayNet = todayEarnings - todayExpenses;
    const goalProgress =
      state.goalTarget > 0 ? Math.min(1, todayEarnings / state.goalTarget) : 0;
    const todayRides = state.rideHistory.filter(
      (r) => r.completedAt && isToday(r.completedAt)
    ).length;

    return {
      state,
      dispatch,
      todayEarnings,
      todayExpenses,
      todayNet,
      goalProgress,
      todayRides
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}

export function useSetStatus() {
  const { dispatch } = useApp();
  return useCallback(
    (status: DriverStatus) => dispatch({ type: 'SET_STATUS', status }),
    [dispatch]
  );
}

export function useSimulateRide() {
  const { dispatch, state } = useApp();
  return useCallback(
    (build: () => RideRequest) => {
      if (state.status !== 'available') return;
      dispatch({ type: 'NEW_RIDE_REQUEST', ride: build() });
    },
    [dispatch, state.status]
  );
}
