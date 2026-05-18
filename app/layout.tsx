import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
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
  title: "Battle Starter",
  description: "Minimal Next.js + Prisma + JWT starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><CurrencyProvider><MaintenanceGuard><AppShell>{children}</AppShell></MaintenanceGuard></CurrencyProvider></body>
    </html>
  );
}
