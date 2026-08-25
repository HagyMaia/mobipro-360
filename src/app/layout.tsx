import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
      <body className={`${inter.variable} font-sans antialiased bg-[#070D18] dark:bg-dark text-gray-900 dark:text-slate-50 transition-colors min-h-dvh select-none`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppProvider>
              <div className="mx-auto min-h-dvh max-w-md w-full flex flex-col relative bg-[#0B141A] dark:bg-[#0B1220] shadow-2xl overflow-x-hidden">
                {children}
              </div>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}