import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/nav";

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
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
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
            <Nav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
            <span>Phone Home ® — plataforma multi-assistência</span>
            <Link href="/privacidade" className="hover:text-slate-600">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-slate-600">
              Termos de uso
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
