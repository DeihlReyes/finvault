import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/providers/toast-provider";
import { SwRegistration } from "@/components/providers/sw-registration";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FinVault — Gamified Personal Finance",
  description:
    "Track spending, build budgets, and level up your finances — completely free.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#6C47FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased", rajdhani.variable, "font-sans")}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#6C47FF" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
        <SwRegistration />
      </body>
    </html>
  );
}
