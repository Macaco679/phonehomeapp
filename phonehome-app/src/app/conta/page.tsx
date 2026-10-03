"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { MenuList } from "@/components/menu-list";
import { Icon } from "@/components/icons";

export default function ContaPage() {
  const { user, cliente, assistenciaUsuario, loading, signOut } = useAuth();
  const router = useRouter();

  async function sair() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon name="user" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Entre na sua conta</h1>
          <p className="mt-1 text-sm text-blue-100">Agende reparos, acompanhe em tempo real e pague pelo app.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login">
              <Button className="w-full px-3 bg-white text-blue-700 shadow-none hover:bg-blue-50" size="lg">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="w-full whitespace-nowrap border border-white/40 bg-transparent px-3 text-white shadow-none hover:bg-white/10" size="lg">
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-6">
          <MenuList
            itens={[
              { href: "/suporte", icon: "help", titulo: "Suporte", tom: "cinza" },
            { href: "/termos", icon: "doc", titulo: "Termos de uso", tom: "cinza" },
              { href: "/privacidade", icon: "shield", titulo: "Privacidade", tom: "cinza" },
            ]}
          />
        </div>
      </div>
    );
  }

  const nome = cliente?.nome ?? assistenciaUsuario?.nome ?? user.email?.split("@")[0] ?? "Minha conta";
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <PageHeader title="Conta" />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white">
          {inicial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{nome}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          {cliente?.telefone && <p className="truncate text-sm text-slate-500">{cliente.telefone}</p>}
        </div>
      </div>

      <div className="space-y-5">
        <MenuList
          itens={[
            { href: "/meus-reparos", icon: "clipboard", titulo: "Meus reparos", texto: "Acompanhe e pague seus serviços" },
            { href: "/meus-pedidos", icon: "bag", titulo: "Meus pedidos", texto: "Compras na loja de peças e acessórios" },
            { href: "/agendar", icon: "calendar", titulo: "Agendar novo reparo" },
          ]}
        />

        <MenuList
          itens={[
            {
              href: "/dashboard",
              icon: "wrench",
              tom: "roxo",
              titulo: assistenciaUsuario ? "Painel da assistência" : "Sou assistência técnica",
              texto: assistenciaUsuario ? "Fila, OS, estoque e caixa" : "Cadastre-se e receba trabalhos",
            },
          ]}
        />

        <MenuList
          itens={[
            { href: "/suporte", icon: "help", titulo: "Suporte", tom: "cinza" },
            { href: "/termos", icon: "doc", titulo: "Termos de uso", tom: "cinza" },
            { href: "/privacidade", icon: "shield", titulo: "Privacidade", tom: "cinza" },
            { onClick: sair, icon: "logout", titulo: "Sair da conta", tom: "vermelho" },
          ]}
        />
      </div>
    </div>
  );
}
