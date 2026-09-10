import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SR Logística - App do Motorista',
    short_name: 'SR Motorista',
    description: 'Aplicativo oficial do motorista e frotista da SR Logística com despacho e corridas em tempo real.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#070D18',
    theme_color: '#F59E0B',
    categories: ['travel', 'business', 'productivity', 'utilities'],
    lang: 'pt-BR',
    dir: 'ltr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Tela Inicial SR Logística',
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Painel Central SR Logística',
      },
    ],
    shortcuts: [
      {
        name: 'Abrir Mapa',
        short_name: 'Mapa',
        description: 'Ver corridas no mapa em tempo real',
        url: '/mapa',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Minhas Corridas',
        short_name: 'Corridas',
        description: 'Acessar histórico e corridas ativas',
        url: '/corridas',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
