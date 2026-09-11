import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalPasswordResetModal } from '@/components/Auth/GlobalPasswordResetModal';
import { ServiceWorkerRegister } from '@/components/PWA/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SR Logística - App do Motorista',
  description: 'Aplicativo oficial para motoristas e frotistas da SR Logística. Gerenciamento de corridas, despacho e repasses em tempo real.',
  manifest: '/manifest.webmanifest',
  applicationName: 'SR Logística',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SR Logística',
  },
  openGraph: {
    title: 'SR Logística - App do Motorista',
    description: 'Central oficial de despacho e mobilidade para motoristas parceiros da SR Logística.',
    images: [{ url: '/screenshot-desktop.png', width: 1920, height: 1080, alt: 'SR Logística' }],
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#070D18',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="serviceworker" href="/sw.js" />
        <meta name="theme-color" content="#070D18" />
        <meta name="msapplication-navbutton-color" content="#070D18" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PWA] Falha ao registrar Service Worker:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased bg-[color:var(--bg)] dark:bg-dark transition-colors min-h-dvh select-none`}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <div className="mx-auto min-h-dvh max-w-md w-full flex flex-col relative bg-[color:var(--surface)] dark:bg-dark-900 shadow-2xl overflow-x-hidden text-inherit">
                {children}
              </div>
              <GlobalPasswordResetModal />
              <ServiceWorkerRegister />
              <div className="fixed right-4 bottom-20 z-[1110]">
                <ThemeToggle />
              </div>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}