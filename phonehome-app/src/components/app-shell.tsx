"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

type Aba = { href: string; label: string; icon: IconName; ativa: (p: string) => boolean };

const ABAS_CLIENTE: Aba[] = [
  { href: "/", label: "Início", icon: "home", ativa: (p) => p === "/" },
  { href: "/agendar", label: "Agendar", icon: "calendar", ativa: (p) => p.startsWith("/agendar") },
  { href: "/meus-reparos", label: "Reparos", icon: "clipboard", ativa: (p) => p.startsWith("/meus-reparos") },
  { href: "/loja", label: "Loja", icon: "bag", ativa: (p) => p.startsWith("/loja") },
  {
    href: "/conta",
    label: "Conta",
    icon: "user",
    ativa: (p) => p.startsWith("/conta") || p.startsWith("/meus-pedidos"),
  },
];

const ABAS_ASSISTENCIA: Aba[] = [
  { href: "/dashboard", label: "Fila", icon: "inbox", ativa: (p) => p === "/dashboard" },
  { href: "/dashboard/os", label: "OS", icon: "clipboard", ativa: (p) => p.startsWith("/dashboard/os") },
  { href: "/dashboard/estoque", label: "Estoque", icon: "box", ativa: (p) => p.startsWith("/dashboard/estoque") },
  { href: "/dashboard/caixa", label: "Caixa", icon: "cash", ativa: (p) => p.startsWith("/dashboard/caixa") },
  {
    href: "/dashboard/mais",
    label: "Mais",
    icon: "more",
    ativa: (p) =>
      p.startsWith("/dashboard/mais") ||
      p.startsWith("/dashboard/relatorios") ||
      p.startsWith("/dashboard/equipe") ||
      p.startsWith("/dashboard/loja") ||
      p.startsWith("/dashboard/configuracoes") ||
      p.startsWith("/admin"),
  },
];

// Telas de entrada: sem barra de abas, tela cheia como em um app.
const TELAS_DE_ENTRADA = ["/login", "/cadastro", "/completar-cadastro"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, assistenciaUsuario } = useAuth();

  const entrada = TELAS_DE_ENTRADA.some((p) => pathname.startsWith(p));
  const modoAssistencia = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const abas = modoAssistencia ? ABAS_ASSISTENCIA : ABAS_CLIENTE;

  if (entrada) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Topo */}
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href={modoAssistencia ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Phone Home" width={140} height={34} priority className="h-7 w-auto" />
            {modoAssistencia && (
              <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Parceiro
              </span>
            )}
          </Link>

          {/* Navegação de computador */}
          <nav className="hidden items-center gap-1 md:flex">
            {abas.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  a.ativa(pathname) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {a.label}
              </Link>
            ))}
            {!modoAssistencia && (
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Sou assistência
              </Link>
            )}
            {modoAssistencia && (
              <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Ver como cliente
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {modoAssistencia && assistenciaUsuario && (
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-600 sm:block">
                {assistenciaUsuario.nome}
              </span>
            )}
            {!loading && !user && (
              <Link
                href="/login"
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Entrar
              </Link>
            )}
            {!loading && user && (
              <Link
                href={modoAssistencia ? "/dashboard/mais" : "/conta"}
                aria-label="Minha conta"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
              >
                <Icon name="user" className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pb-tabbar flex-1">{children}</main>

      {/* Rodapé (só computador) */}
      <footer className="hidden border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 md:block">
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

      {/* Barra de abas (celular) */}
      <nav
        aria-label="Navegação principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-lg grid-cols-5">
          {abas.map((a) => {
            const ativa = a.ativa(pathname);
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  aria-current={ativa ? "page" : undefined}
                  className="flex h-full flex-col items-center justify-center gap-1 active:scale-95"
                >
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition",
                      ativa ? "bg-blue-100 text-blue-700" : "text-slate-400"
                    )}
                  >
                    <Icon name={a.icon} className="h-[22px] w-[22px]" strokeWidth={ativa ? 2.1 : 1.8} />
                  </span>
                  <span className={cn("text-[11px] font-medium leading-none", ativa ? "text-blue-700" : "text-slate-500")}>
                    {a.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
