import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phone Home — Conserto de celular onde você estiver",
  description:
    "Agende o conserto do seu celular e acompanhe em tempo real. Assistências parceiras: gerencie ordens de serviço, estoque e caixa em um só lugar.",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-180.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Phone Home"
                width={140}
                height={34}
                priority
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/agendar" className="hover:text-blue-600">
                Agendar reparo
              </Link>
              <Link href="/meus-reparos" className="hover:text-blue-600">
                Meus reparos
              </Link>
              <Link href="/dashboard" className="hover:text-blue-600">
                Sou assistência
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          Phone Home ® — plataforma multi-assistência
        </footer>
      </body>
    </html>
  );
}
