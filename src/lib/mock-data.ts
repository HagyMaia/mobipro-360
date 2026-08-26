import type {
  DriverProfile,
  EmergencyContact,
  Expense,
  HeatZone,
  PassengerFilters,
  RideRequest
} from './types';

export const DEFAULT_PROFILE: DriverProfile = {
  name: 'Carlos Silva',
  phone: '(11) 98765-4321',
  city: 'Manaus - AM',
  rating: 4.92,
  totalRides: 1843,
  vehicle: {
    model: 'Toyota Corolla 1.8',
    plate: 'BRA2E19',
    color: 'Prata',
    year: 2021
  },
  license: '12345678901'
};

export const DEFAULT_FILTERS: PassengerFilters = {
  minRating: 4.5,
  minAccountMonths: 3,
  rejectCash: false,
  autoReject: true
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id: 'c1', name: 'Maria Silva (Esposa)', phone: '(11) 99888-1122', relationship: 'Família' },
  { id: 'c2', name: 'João Pereira', phone: '(11) 97777-3344', relationship: 'Colega de trabalho' }
];

export const HEAT_ZONES: HeatZone[] = [
  { id: 'z1', name: 'Centro / Teatro Amazonas', lat: -3.1316, lng: -60.0236, intensity: 92, radiusKm: 2.2, avgFare: 28.5, events: ['Hora do rush'] },
  { id: 'z2', name: 'Aeroporto Eduardo Gomes', lat: -3.0386, lng: -60.0497, intensity: 88, radiusKm: 3.0, avgFare: 65.0, events: ['Chegada de voos'] },
  { id: 'z3', name: 'Ponta Negra', lat: -3.0863, lng: -60.0789, intensity: 81, radiusKm: 2.0, avgFare: 35.0, events: ['Movimento noturno'] },
  { id: 'z4', name: 'Adrianópolis', lat: -3.1019, lng: -60.0075, intensity: 84, radiusKm: 1.8, avgFare: 32.0, events: ['Eventos e restaurantes'] },
  { id: 'z5', name: 'Parque Dez', lat: -3.0710, lng: -59.9850, intensity: 74, radiusKm: 2.4, avgFare: 26.0 },
  { id: 'z6', name: 'Vieiralves', lat: -3.1064, lng: -60.0240, intensity: 70, radiusKm: 2.1, avgFare: 29.0 },
  { id: 'z7', name: 'Compensa', lat: -3.1230, lng: -60.0560, intensity: 64, radiusKm: 2.6, avgFare: 33.0 },
  { id: 'z8', name: 'Flores', lat: -3.0850, lng: -60.0050, intensity: 78, radiusKm: 1.9, avgFare: 34.5 },
  { id: 'z9', name: 'Manauara Shopping', lat: -3.1060, lng: -60.0080, intensity: 62, radiusKm: 2.3, avgFare: 24.0 },
  { id: 'z10', name: 'Distrito Industrial', lat: -3.1340, lng: -59.9560, intensity: 86, radiusKm: 1.7, avgFare: 38.0 },
  { id: 'z11', name: 'São José Operário', lat: -3.0700, lng: -59.9300, intensity: 58, radiusKm: 3.2, avgFare: 55.0 },
  { id: 'z12', name: 'Aleixo', lat: -3.0890, lng: -59.9900, intensity: 55, radiusKm: 2.8, avgFare: 22.0 }
];

const REQUEST_TEMPLATES: Array<Omit<RideRequest, 'id' | 'requestedAt' | 'source'>> = [
  {
    passengerName: 'Ana B.',
    passengerRating: 4.9,
    passengerAccountMonths: 24,
    passengerTrips: 312,
    pickup: 'Av. Eduardo Ribeiro, Centro',
    dropoff: 'Aeroporto Eduardo Gomes',
    distanceKm: 9.4,
    estimatedMinutes: 32,
    fare: 52.0,
    paymentMethod: 'pix'
  },
  {
    passengerName: 'José M.',
    passengerRating: 3.2,
    passengerAccountMonths: 1,
    passengerTrips: 2,
    pickup: 'Terminal Rodoviário de Manaus',
    dropoff: 'Ponta Negra',
    distanceKm: 18.2,
    estimatedMinutes: 55,
    fare: 74.0,
    paymentMethod: 'cash'
  },
  {
    passengerName: 'Felipe R.',
    passengerRating: 4.7,
    passengerAccountMonths: 11,
    passengerTrips: 89,
    pickup: 'Adrianópolis, Manaus',
    dropoff: 'Manauara Shopping',
    distanceKm: 6.8,
    estimatedMinutes: 24,
    fare: 29.5,
    paymentMethod: 'card'
  },
  {
    passengerName: 'Marina C.',
    passengerRating: 4.95,
    passengerAccountMonths: 48,
    passengerTrips: 512,
    pickup: 'Faria Lima, 3900',
    dropoff: 'Parque Ibirapuera',
    distanceKm: 7.1,
    estimatedMinutes: 25,
    fare: 31.0,
    paymentMethod: 'pix'
  },
  {
    passengerName: 'Renato L.',
    passengerRating: 2.8,
    passengerAccountMonths: 0,
    passengerTrips: 0,
    pickup: 'Av. dos Bandeirantes',
    dropoff: 'Cidade Tiradentes',
    distanceKm: 22.4,
    estimatedMinutes: 68,
    fare: 88.0,
    paymentMethod: 'cash'
  },
  {
    passengerName: 'Sofia N.',
    passengerRating: 4.8,
    passengerAccountMonths: 9,
    passengerTrips: 140,
    pickup: 'Moema, Av. Ibirapuera',
    dropoff: 'Tatuapé',
    distanceKm: 12.3,
    estimatedMinutes: 38,
    fare: 41.5,
    paymentMethod: 'card'
  }
];

export function buildMockRequest(index = 0): RideRequest {
  const tpl = REQUEST_TEMPLATES[index % REQUEST_TEMPLATES.length];
  return {
    ...tpl,
    id: `req_${Date.now().toString(36)}`,
    requestedAt: new Date().toISOString(),
    source: 'app'
  };
}

export const SEED_EXPENSES: Expense[] = [
  { id: 'e1', amount: 180.0, category: 'combustivel', note: 'Tanque completo', date: new Date().toISOString().slice(0, 10) },
  { id: 'e2', amount: 24.9, category: 'alimentacao', note: 'Almoço', date: new Date().toISOString().slice(0, 10) },
  { id: 'e3', amount: 35.0, category: 'lavagem', note: 'Lavagem completa', date: new Date().toISOString().slice(0, 10) }
];

export function nowIso(): string {
  return new Date().toISOString();
}
