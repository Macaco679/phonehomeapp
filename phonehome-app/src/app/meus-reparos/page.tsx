"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { iniciarPagamento } from "@/lib/pagamento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { STATUS_LABEL, formatBRL, type Trabalho } from "@/lib/types";

function MeusReparos() {
  const { user, cliente, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const pagamentoRetorno = params.get("pagamento");
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [contestando, setContestando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cliente) return;
    const { data } = await supabase
      .from("marketplace_trabalhos")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false });
    const lista = (data as Trabalho[]) ?? [];
    setTrabalhos(lista);
    const ids = Array.from(new Set(lista.map((t) => t.assistencia_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: ass } = await supabase.from("marketplace_assistencias").select("id, nome").in("id", ids);
      setNomes(Object.fromEntries((ass ?? []).map((a) => [a.id, a.nome])));
    }
  }, [cliente, supabase]);

  useEffect(() => {
    load();
    if (!cliente) return;
    const channel = supabase
      .channel("meus-reparos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_trabalhos",
          filter: `cliente_id=eq.${cliente.id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente, load, supabase]);

  async function cancelar(id: string) {
    setBusy(id);
    setError(null);
    const { error } = await supabase.from("marketplace_trabalhos").update({ status: "cancelado" }).eq("id", id);
    if (error) setError(error.message);
    await load();
    setBusy(null);
  }

  async function confirmar(id: string, ok: boolean) {
    setBusy(id);
    setError(null);
    const { error } = await supabase.rpc("marketplace_confirmar_valor", {
      p_trabalho: id,
      p_ok: ok,
      p_motivo: ok ? null : motivo,
    });
    if (error) setError(error.message);
    else {
      setContestando(null);
      setMotivo("");
    }
    await load();
    setBusy(null);
  }

  async function pagar(id: string) {
    setBusy(id);
    setError(null);
    const r = await iniciarPagamento("trabalho", id);
    if (r.url) {
      window.location.href = r.url;
      return;
    }
    setError(r.error ?? "Não foi possível iniciar o pagamento.");
    setBusy(null);
  }

  if (loading) return null;

  if (!user || !cliente) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Entre para ver seus reparos</h1>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Meus reparos</h1>
        <Link href="/agendar">
          <Button size="sm">Novo agendamento</Button>
        </Link>
      </div>

      {pagamentoRetorno === "ok" && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Pagamento recebido! Em instantes ele aparece confirmado aqui.
        </p>
      )}
      {pagamentoRetorno === "pendente" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Seu pagamento está em análise. Assim que o Mercado Pago confirmar, ele aparece aqui.
        </p>
      )}
      {pagamentoRetorno === "falhou" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          O pagamento não foi concluído. Você pode tentar de novo no botão abaixo.
        </p>
      )}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {trabalhos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Você ainda não agendou nenhum reparo.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {trabalhos.map((t) => {
          const precisaPagar =
            t.status === "concluido" && t.forma_pagamento === "app" && !t.pago_em_app && !!t.valor_final;
          const precisaConfirmar = t.status === "concluido" && t.cliente_confirmacao === "pendente";
          return (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {t.marca} {t.modelo} — {t.tipo_reparo}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                    {t.assistencia_id && nomes[t.assistencia_id] && (
                      <p className="mt-1 text-sm text-slate-500">Assistência: {nomes[t.assistencia_id]}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">
                      {t.valor_final ? `Valor final: ${formatBRL(t.valor_final)}` : `Estimado: ${formatBRL(t.preco_estimado)}`}
                      {t.status === "concluido" && t.pago_em_app && " · pago pelo app"}
                      {t.status === "concluido" && t.forma_pagamento === "presencial" && " · pagamento presencial"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge status={t.status}>{STATUS_LABEL[t.status]}</Badge>
                    {t.status === "fila" && (
                      <Button size="sm" variant="ghost" disabled={busy === t.id} onClick={() => cancelar(t.id)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {precisaPagar && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="text-sm text-blue-900">
                      Pague pelo app com Pix ou cartão — {formatBRL(t.valor_final)}.
                    </p>
                    <Button size="sm" className="mt-2" disabled={busy === t.id} onClick={() => pagar(t.id)}>
                      {busy === t.id ? "Abrindo..." : "Pagar agora"}
                    </Button>
                  </div>
                )}

                {precisaConfirmar && contestando !== t.id && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">
                      A assistência informou <span className="font-medium">{formatBRL(t.valor_final)}</span> por este
                      serviço. O valor está correto?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" disabled={busy === t.id} onClick={() => confirmar(t.id, true)}>
                        Está correto
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setContestando(t.id)}>
                        Tem algo errado
                      </Button>
                    </div>
                  </div>
                )}

                {precisaConfirmar && contestando === t.id && (
                  <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">Conte o que aconteceu (valor diferente, serviço não feito…):</p>
                    <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy === t.id || !motivo.trim()} onClick={() => confirmar(t.id, false)}>
                        Enviar contestação
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setContestando(null)}>
                        Voltar
                      </Button>
                    </div>
                  </div>
                )}

                {t.status === "concluido" && t.cliente_confirmacao === "confirmado" && (
                  <p className="mt-3 text-xs text-emerald-700">Você confirmou o valor deste serviço. Obrigado!</p>
                )}
                {t.status === "concluido" && t.cliente_confirmacao === "contestado" && (
                  <p className="mt-3 text-xs text-amber-700">
                    Contestação enviada — nossa equipe vai analisar e entrar em contato.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function MeusReparosPage() {
  return (
    <Suspense fallback={null}>
      <MeusReparos />
    </Suspense>
  );
}
