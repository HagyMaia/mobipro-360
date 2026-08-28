import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

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
              <div className="mx-auto min-h-dvh max-w-md w-full flex flex-col relative bg-[color:var(--surface)] dark:bg-[#0B1220] shadow-2xl overflow-x-hidden text-inherit">
                {children}
              </div>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}