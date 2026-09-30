"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/card";
import { MenuList, type ItemMenu } from "@/components/menu-list";

export default function MaisPage() {
  const { assistenciaUsuario, signOut, user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.rpc("marketplace_is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [supabase]);

  async function sair() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  if (!assistenciaUsuario) return null;

  const gestao: ItemMenu[] = [
    { href: "/dashboard/loja", icon: "store", titulo: "Loja", texto: "Produtos e pedidos da sua assistência" },
    { href: "/dashboard/relatorios", icon: "chart", titulo: "Relatórios", texto: "Produção e faturamento" },
    { href: "/dashboard/equipe", icon: "users", titulo: "Equipe", texto: "Técnicos e convites" },
    { href: "/dashboard/configuracoes", icon: "settings", titulo: "Minha assistência", texto: "Endereço, raio de atendimento e dados" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Mais" subtitle={`${assistenciaUsuario.nome ?? "Minha assistência"} · ${assistenciaUsuario.papel === "dono" ? "dono" : "técnico"}`} />
      <div className="space-y-5">
        <MenuList itens={gestao} />
        {isAdmin && (
          <MenuList itens={[{ href: "/admin", icon: "shield", tom: "roxo", titulo: "Administração da plataforma", texto: "Acertos, contestações e preços" }]} />
        )}
        <MenuList
          itens={[
            { href: "/", icon: "home", tom: "cinza", titulo: "Ver como cliente" },
            { onClick: sair, icon: "logout", tom: "vermelho", titulo: "Sair", texto: user?.email ?? undefined },
          ]}
        />
      </div>
    </div>
  );
}
