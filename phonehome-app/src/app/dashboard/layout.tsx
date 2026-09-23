"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Fila de trabalhos" },
  { href: "/dashboard/os", label: "Ordens de serviço" },
  { href: "/dashboard/estoque", label: "Estoque" },
  { href: "/dashboard/caixa", label: "Caixa" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, assistenciaUsuario, loading, signOut } = useAuth();
  const pathname = usePathname();

  if (loading) return null;

  if (!user || !assistenciaUsuario) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Área da assistência técnica
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Entre com a conta da sua assistência, ou cadastre uma nova.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
          <Link href="/cadastro?tipo=assistencia">
            <Button>Cadastrar assistência</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="w-56 shrink-0">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          Assistência
        </p>
        <p className="mb-4 truncate font-medium text-slate-900">
          {assistenciaUsuario.nome ?? "Minha assistência"}
        </p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6 w-full justify-start"
          onClick={() => signOut()}
        >
          Sair
        </Button>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
