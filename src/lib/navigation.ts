/**
 * Utilitário de navegação — abre o endereço ou coordenadas no Waze ou Google Maps
 * via deep link nativo no celular ou navegador web.
 */

export type NavApp = 'waze' | 'gmaps';

export interface NavCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Gera o deep link para o aplicativo de navegação escolhido (Waze ou Google Maps)
 * priorizando coordenadas exatas de GPS quando disponíveis.
 */
export function buildNavUrl(
  address: string,
  app: NavApp,
  coords?: NavCoordinates | null
): string {
  const hasCoords =
    coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude);

  if (app === 'waze') {
    if (hasCoords) {
      return `https://waze.com/ul?ll=${coords.latitude},${coords.longitude}&navigate=yes`;
    }
    return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  }

  // Google Maps
  if (hasCoords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

/**
 * Abre o Waze diretamente
 */
export function openWaze(address: string, coords?: NavCoordinates | null): void {
  const url = buildNavUrl(address, 'waze', coords);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Abre o Google Maps diretamente
 */
export function openGoogleMaps(address: string, coords?: NavCoordinates | null): void {
  const url = buildNavUrl(address, 'gmaps', coords);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Abre o aplicativo de navegação configurado
 */
export function openNavigation(
  address: string,
  app: NavApp = 'waze',
  coords?: NavCoordinates | null
): void {
  if (!address || address === '—') return;
  const url = buildNavUrl(address, app, coords);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
