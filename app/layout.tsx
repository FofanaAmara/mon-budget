import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProviders } from "./providers";
import LayoutShell from "@/components/LayoutShell";
import ServiceWorkerInit from "@/components/ServiceWorkerInit";
import { getOrInitSetupGuideData } from "@/lib/actions/setup-guide";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mes Finances",
  description: "Toute ta vie financière, claire et sous contrôle",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mes Finances",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#FAFBFC",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Safe fetch — returns null if not authenticated
  const guideData = await getOrInitSetupGuideData().catch(() => null);

  return (
    <html lang="fr" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-[family-name:var(--font-jakarta)] antialiased">
        <AuthProviders>
          <LayoutShell guideData={guideData}>{children}</LayoutShell>
        </AuthProviders>
        <ServiceWorkerInit />
      </body>
    </html>
  );
}
