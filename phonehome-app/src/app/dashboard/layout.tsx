"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Fila de trabalhos" },
  { href: "/dashboard/os", label: "Ordens de serviço" },
  { href: "/dashboard/estoque", label: "Estoque" },
  { href: "/dashboard/loja", label: "Loja" },
  { href: "/dashboard/caixa", label: "Caixa" },
  { href: "/dashboard/relatorios", label: "Relatórios" },
  { href: "/dashboard/equipe", label: "Equipe" },
  { href: "/dashboard/configuracoes", label: "Minha assistência" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, assistenciaUsuario, loading, signOut } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const [bloqueada, setBloqueada] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pausada, setPausada] = useState(false);

  useEffect(() => {
    if (!assistenciaUsuario) return;
    supabase
      .rpc("marketplace_assistencia_bloqueada", { p_assistencia: assistenciaUsuario.assistencia_id })
      .then(({ data }) => setBloqueada(Boolean(data)));
    supabase.rpc("marketplace_is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
    supabase
      .from("marketplace_assistencias")
      .select("status")
      .eq("id", assistenciaUsuario.assistencia_id)
      .maybeSingle()
      .then(({ data }) => setPausada(data?.status === "pausada"));
  }, [assistenciaUsuario, supabase, pathname]);

  if (loading) return null;

  if (!user || !assistenciaUsuario) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Área da assistência técnica</h1>
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="shrink-0 md:w-56">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Assistência</p>
        <p className="mb-4 truncate font-medium text-slate-900">
          {assistenciaUsuario.nome ?? "Minha assistência"}
          <span className="ml-2 text-xs font-normal text-slate-400">
            {assistenciaUsuario.papel === "dono" ? "dono" : "técnico"}
          </span>
        </p>
        <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1 md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              Administração
            </Link>
          )}
        </nav>
        <Button variant="ghost" size="sm" className="mt-6 w-full justify-start" onClick={() => signOut()}>
          Sair
        </Button>
      </aside>
      <div className="min-w-0 flex-1">
        {pausada && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Sua assistência está pausada pela plataforma. Fale com a Phone Home para regularizar.
          </p>
        )}
        {bloqueada && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Há comissões pendentes além do prazo ou do limite. Enquanto não forem quitadas, você não consegue
            aceitar novos trabalhos da fila —{" "}
            <Link href="/dashboard/caixa" className="font-medium underline">
              veja no Caixa
            </Link>
            .
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
