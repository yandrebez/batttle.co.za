import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthNav } from "@/components/auth-nav";
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
  title: "Batttle Shop",
  description: "Next.js full-stack shop with JWT auth and role-based access",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthNav />
        <main className="page-container">{children}</main>
      </body>
    </html>
  );
}
