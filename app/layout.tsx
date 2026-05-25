import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { getSiteSettings } from "@/lib/siteSettings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://batttle.vercel.app"),
  title: {
    default: "BATTTLE Store",
    template: "%s | BATTTLE Store",
  },
  description: "BATTTLE Store official shop. Browse drops, manage orders, and track delivery in one place.",
  applicationName: "BATTTLE Store",
  openGraph: {
    title: "BATTTLE Store",
    description: "BATTTLE Store official shop. Browse drops, manage orders, and track delivery in one place.",
    url: "/",
    siteName: "BATTTLE Store",
    type: "website",
    images: [
      {
        url: "/battle-mark.svg",
        width: 512,
        height: 512,
        alt: "BATTTLE Store icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "BATTTLE Store",
    description: "BATTTLE Store official shop. Browse drops, manage orders, and track delivery in one place.",
    images: ["/battle-mark.svg"],
  },
  icons: {
    icon: "/battle-mark.svg",
    shortcut: "/battle-mark.svg",
    apple: "/battle-mark.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CurrencyProvider>
          <MaintenanceGuard>
            <AppShell initialMaintenanceMode={settings.maintenanceMode}>{children}</AppShell>
          </MaintenanceGuard>
        </CurrencyProvider>
      </body>
    </html>
  );
}
