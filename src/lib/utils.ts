export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

export function formatBRLShort(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calcPerKm(fare: number, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return fare / distanceKm;
}

export function calcPerHour(fare: number, minutes: number): number {
  if (minutes <= 0) return 0;
  return (fare / minutes) * 60;
}

export function ratingColor(rating: number): string {
  if (rating >= 4.7) return 'text-success';
  if (rating >= 4.0) return 'text-warn';
  return 'text-danger';
}

export function isProfitable(perKm: number, perHour: number): 'excellent' | 'good' | 'poor' {
  if (perHour >= 35 && perKm >= 1.8) return 'excellent';
  if (perHour >= 22 || perKm >= 1.2) return 'good';
  return 'poor';
}

export function profitabilityMeta(
  verdict: 'excellent' | 'good' | 'poor'
): { label: string; color: string; icon: string } {
  switch (verdict) {
    case 'excellent':
      return { label: 'Excelente corrida', color: '#10B981', icon: '👍' };
    case 'good':
      return { label: 'Boa corrida', color: '#F59E0B', icon: '🙂' };
    default:
      return { label: 'Baixa rentabilidade', color: '#EF4444', icon: '⚠' };
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isToday(dateIso: string): boolean {
  return dateIso.slice(0, 10) === todayKey();
}
