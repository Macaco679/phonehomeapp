"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Fila de trabalhos", icon: "inbox" },
  { href: "/dashboard/os", label: "Ordens de serviço", icon: "clipboard" },
  { href: "/dashboard/estoque", label: "Estoque", icon: "box" },
  { href: "/dashboard/loja", label: "Loja", icon: "store" },
  { href: "/dashboard/caixa", label: "Caixa", icon: "cash" },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: "chart" },
  { href: "/dashboard/equipe", label: "Equipe", icon: "users" },
  { href: "/dashboard/configuracoes", label: "Minha assistência", icon: "settings" },
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
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Icon name="wrench" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Área da assistência técnica</h1>
          <p className="mt-1 text-sm text-slate-300">
            Receba trabalhos da fila, controle OS, estoque e caixa em um só lugar.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login">
              <Button className="w-full bg-white text-slate-900 shadow-none hover:bg-slate-100" size="lg">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro?tipo=assistencia">
              <Button className="w-full px-3" size="lg">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 md:flex-row md:py-8">
      {/* Menu lateral (computador). No celular, a barra de abas faz esse papel. */}
      <aside className="hidden shrink-0 md:block md:w-60">
        <div className="sticky top-20">
          <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Assistência</p>
            <p className="truncate text-sm font-semibold text-slate-900">{assistenciaUsuario.nome ?? "Minha assistência"}</p>
            <p className="text-xs text-slate-400">{assistenciaUsuario.papel === "dono" ? "Dono" : "Técnico"}</p>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const ativa = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    ativa ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-white"
                  )}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
              >
                <Icon name="shield" className="h-[18px] w-[18px]" />
                Administração
              </Link>
            )}
          </nav>
          <Button variant="ghost" size="sm" className="mt-4 w-full justify-start" onClick={() => signOut()}>
            <Icon name="logout" className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {pausada && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            Sua assistência está pausada pela plataforma. Fale com a Phone Home para regularizar.
          </p>
        )}
        {bloqueada && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
            Há comissões pendentes além do prazo ou do limite. Enquanto não forem quitadas, você não consegue
            aceitar novos trabalhos da fila —{" "}
            <Link href="/dashboard/caixa" className="font-semibold underline">
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
