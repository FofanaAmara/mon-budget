import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import ServiceWorkerInit from '@/components/ServiceWorkerInit';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mon Budget',
  description: 'Gérez vos dépenses, sections et cartes bancaires',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mon Budget',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F5F4F1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={geist.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-[family-name:var(--font-geist)] antialiased">
        <BottomNav />
        {/* On mobile: centered max-w-lg. On desktop: offset by sidebar width */}
        <div className="md:ml-[240px]">
          <div className="max-w-lg mx-auto md:max-w-2xl min-h-dvh relative">
            {children}
          </div>
        </div>
        <ServiceWorkerInit />
      </body>
    </html>
  );
}
