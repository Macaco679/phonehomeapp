"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { ModoLoja } from "@/components/loja/catalogo";
import { createClient } from "@/lib/supabase/client";
import { iniciarPagamento } from "@/lib/pagamento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import {
  STATUS_PEDIDO_LABEL,
  formatBRL,
  formatData,
  type Pedido,
  type PedidoItem,
} from "@/lib/types";

const COR: Record<string, string> = {
  aguardando_pagamento: "bg-amber-100 text-amber-800",
  pago: "bg-blue-100 text-blue-800",
  enviado: "bg-indigo-100 text-indigo-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-slate-200 text-slate-600",
};

function Pedidos({ modo }: { modo: ModoLoja }) {
  const { user, cliente, assistenciaUsuario, loading } = useAuth();
  const compradorId = modo === "cliente" ? cliente?.id : assistenciaUsuario?.assistencia_id;
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const retorno = params.get("pagamento");
  const novo = params.get("novo");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!compradorId) return;
    const { data } = await supabase
      .from("marketplace_pedidos")
      .select("*, itens:marketplace_pedido_itens(*)")
      .eq(modo === "cliente" ? "cliente_id" : "comprador_assistencia_id", compradorId)
      .order("created_at", { ascending: false });
    setPedidos((data as Pedido[]) ?? []);
  }, [compradorId, modo, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function pagar(id: string) {
    setBusy(id);
    setErro(null);
    const r = await iniciarPagamento("pedido", id);
    if (r.url) {
      window.location.href = r.url;
      return;
    }
    setErro(r.error ?? "Não foi possível iniciar o pagamento.");
    setBusy(null);
  }

  async function cancelar(id: string) {
    setBusy(id);
    setErro(null);
    const { error } = await supabase.rpc("marketplace_atualizar_pedido", { p_id: id, p_status: "cancelado" });
    if (error) setErro(error.message);
    await load();
    setBusy(null);
  }

  if (loading) return null;

  if (!user || !compradorId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Entre para ver seus pedidos</h1>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={modo === "cliente" ? "mx-auto max-w-2xl px-4 py-10" : "max-w-2xl"}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{modo === "cliente" ? "Meus pedidos" : "Minhas compras"}</h1>
        <Link href={modo === "cliente" ? "/loja" : "/dashboard/pecas"}>
          <Button size="sm" variant="outline">
            Ir para a loja
          </Button>
        </Link>
      </div>

      {novo && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Pedido criado! Finalize o pagamento para o vendedor separar e enviar.
        </p>
      )}
      {retorno === "ok" && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Pagamento recebido! Em instantes o pedido aparece como pago.
        </p>
      )}
      {retorno === "pendente" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Pagamento em análise pelo Mercado Pago.
        </p>
      )}
      {retorno === "falhou" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          O pagamento não foi concluído. Tente de novo no botão do pedido.
        </p>
      )}
      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      {pedidos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            {modo === "cliente" ? "Você ainda não fez nenhum pedido na loja." : "Sua assistência ainda não comprou peças."}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {pedidos.map((p) => (
          <Card key={p.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">
                    Pedido #{p.id.slice(0, 8)} · {formatBRL(p.total)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatData(p.created_at)}</p>
                  <p className="mt-1 text-sm text-slate-500">Entrega: {p.endereco_entrega}</p>
                </div>
                <Badge className={COR[p.status]}>{STATUS_PEDIDO_LABEL[p.status]}</Badge>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {(p.itens as PedidoItem[] | undefined)?.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>
                      {i.quantidade}× {i.nome}
                    </span>
                    <span>{formatBRL(i.preco_unit * i.quantidade)}</span>
                  </li>
                ))}
              </ul>
              {p.status === "aguardando_pagamento" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={busy === p.id} onClick={() => pagar(p.id)}>
                    {busy === p.id ? "Abrindo..." : "Pagar com Pix ou cartão"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy === p.id} onClick={() => cancelar(p.id)}>
                    Cancelar pedido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Pedidos de quem compra: cliente (/meus-pedidos) ou assistência (/dashboard/compras). */
export function PedidosComprador({ modo }: { modo: ModoLoja }) {
  return (
    <Suspense fallback={null}>
      <Pedidos modo={modo} />
    </Suspense>
  );
}
