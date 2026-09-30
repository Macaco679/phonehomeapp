import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Phone Home — Conserto de celular onde você estiver",
  description:
    "Agende o conserto do seu celular e acompanhe em tempo real. Assistências parceiras: gerencie ordens de serviço, estoque e caixa em um só lugar.",
  applicationName: "Phone Home",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/pwa/512",
  },
  appleWebApp: {
    capable: true,
    title: "Phone Home",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-dvh bg-background text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
