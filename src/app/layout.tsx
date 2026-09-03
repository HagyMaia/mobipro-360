import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'SR Logística - App do Motorista',
  description: 'Super app para motoristas profissionais e taxistas da SR Logística.',
  manifest: '/manifest.webmanifest',
  applicationName: 'SR Logística',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SR Logística'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1220'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`font-sans antialiased bg-[color:var(--bg)] dark:bg-dark transition-colors min-h-dvh select-none`}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <div className="mx-auto min-h-dvh max-w-md w-full flex flex-col relative bg-[color:var(--surface)] dark:bg-dark-900 shadow-2xl overflow-x-hidden text-inherit">
                {children}
              </div>
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