/**
 * Utilitário de navegação — abre o endereço no Waze ou Google Maps
 * via deep link nativo no celular.
 */

export type NavApp = 'waze' | 'gmaps';

/**
 * Gera o deep link para o aplicativo de navegação escolhido.
 * @param address  Endereço de texto (ex: "Av. Paulista, 1578, São Paulo")
 * @param app      'waze' ou 'gmaps'
 */
export function buildNavUrl(address: string, app: NavApp): string {
  const encoded = encodeURIComponent(address);
  if (app === 'waze') {
    // Deep link Waze: abre diretamente na navegação
    return `https://waze.com/ul?q=${encoded}&navigate=yes`;
  }
  // Deep link Google Maps: abre diretamente nas direções
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
}

/**
 * Abre o aplicativo de navegação para o endereço fornecido.
 * Em mobile, dispara o deep link nativo. Em desktop, abre no browser.
 */
export function openNavigation(address: string, app: NavApp): void {
  if (!address || address === '—') return;
  const url = buildNavUrl(address, app);
  window.open(url, '_blank', 'noopener,noreferrer');
}
