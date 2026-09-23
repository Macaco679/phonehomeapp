"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/input";
import {
  STATUS_LABEL,
  formatBRL,
  type StatusTrabalho,
  type Trabalho,
} from "@/lib/types";

const PROXIMO_STATUS: Partial<Record<StatusTrabalho, StatusTrabalho>> = {
  aceito: "a_caminho",
  a_caminho: "em_reparo",
};

export default function OrdensDeServicoPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = createClient();
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [finalizando, setFinalizando] = useState<string | null>(null);
  const [valorFinal, setValorFinal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"app" | "presencial">("presencial");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const { data } = await supabase
      .from("marketplace_trabalhos")
      .select("*")
      .eq("assistencia_id", assistenciaUsuario.assistencia_id)
      .order("created_at", { ascending: false });
    setTrabalhos((data as Trabalho[]) ?? []);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
    if (!assistenciaUsuario) return;
    const channel = supabase
      .channel("os-assistencia")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_trabalhos",
          filter: `assistencia_id=eq.${assistenciaUsuario.assistencia_id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [assistenciaUsuario, load, supabase]);

  async function avancar(t: Trabalho) {
    const proximo = PROXIMO_STATUS[t.status];
    if (!proximo) return;
    setBusy(true);
    await supabase.from("marketplace_trabalhos").update({ status: proximo }).eq("id", t.id);
    setBusy(false);
    await load();
  }

  async function finalizar(t: Trabalho) {
    if (!assistenciaUsuario) return;
    const valor = Number(valorFinal);
    if (!valor || valor <= 0) return;
    setBusy(true);

    const { data: assistencia } = await supabase
      .from("marketplace_assistencias")
      .select("taxa_comissao_pct")
      .eq("id", assistenciaUsuario.assistencia_id)
      .single();
    const taxa = assistencia?.taxa_comissao_pct ?? 15;
    const comissao = Math.round(valor * (taxa / 100) * 100) / 100;

    await supabase
      .from("marketplace_trabalhos")
      .update({
        status: "concluido",
        valor_final: valor,
        forma_pagamento: formaPagamento,
        pago_em_app: formaPagamento === "app",
        concluido_em: new Date().toISOString(),
      })
      .eq("id", t.id);

    await supabase.from("marketplace_caixa").insert([
      {
        assistencia_id: assistenciaUsuario.assistencia_id,
        trabalho_id: t.id,
        tipo: "receita",
        valor,
        descricao: `${t.marca} ${t.modelo} — ${t.tipo_reparo}`,
      },
      {
        assistencia_id: assistenciaUsuario.assistencia_id,
        trabalho_id: t.id,
        tipo: "comissao_plataforma",
        valor: -comissao,
        descricao: `Comissão da plataforma (${taxa}%)`,
      },
    ]);

    setBusy(false);
    setFinalizando(null);
    setValorFinal("");
    await load();
  }

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Ordens de serviço</h1>

      {trabalhos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhuma OS ainda. Aceite trabalhos na fila para eles aparecerem aqui.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {trabalhos.map((t) => (
          <Card key={t.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {t.marca} {t.modelo} — {t.tipo_reparo}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t.valor_final ? formatBRL(t.valor_final) : formatBRL(t.preco_estimado)}
                  </p>
                </div>
                <Badge status={t.status}>{STATUS_LABEL[t.status]}</Badge>
              </div>

              {PROXIMO_STATUS[t.status] && finalizando !== t.id && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => avancar(t)}>
                    Marcar como {STATUS_LABEL[PROXIMO_STATUS[t.status]!]}
                  </Button>
                </div>
              )}

              {t.status === "em_reparo" && finalizando !== t.id && (
                <div className="mt-3">
                  <Button size="sm" onClick={() => setFinalizando(t.id)}>
                    Finalizar e registrar pagamento
                  </Button>
                </div>
              )}

              {finalizando === t.id && (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <Label htmlFor={`valor-${t.id}`}>Valor final (R$)</Label>
                    <Input
                      id={`valor-${t.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={valorFinal}
                      onChange={(e) => setValorFinal(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`pagamento-${t.id}`}>Pagamento</Label>
                    <Select
                      id={`pagamento-${t.id}`}
                      value={formaPagamento}
                      onChange={(e) =>
                        setFormaPagamento(e.target.value as "app" | "presencial")
                      }
                    >
                      <option value="presencial">Presencial / combinado</option>
                      <option value="app">Pelo app</option>
                    </Select>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => finalizar(t)}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setFinalizando(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
