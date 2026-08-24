import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MobiPro 360 - Super App do Motorista',
  description:
    'Corridas, rentabilidade em tempo real, radar de demanda e segurança para motoristas profissionais.',
  manifest: '/manifest.webmanifest',
  applicationName: 'MobiPro 360',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MobiPro 360'
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
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-dark text-gray-900 dark:text-slate-50 transition-colors`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppProvider>
              <main className="mx-auto min-h-dvh max-w-md pb-24">{children}</main>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}