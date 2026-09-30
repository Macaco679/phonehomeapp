"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { iniciarPagamento } from "@/lib/pagamento";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { STATUS_LABEL, formatBRL, formatData, type Trabalho } from "@/lib/types";

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
      <div className="mx-auto max-w-md px-4 py-10">
        <EmptyState
          icon={<Icon name="clipboard" className="h-7 w-7" />}
          title="Entre para ver seus reparos"
          text="Acompanhe cada etapa do conserto em tempo real."
          action={
            <Link href="/login">
              <Button size="lg">Entrar</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const ativos = trabalhos.filter((t) => t.status !== "concluido" && t.status !== "cancelado");
  const historico = trabalhos.filter((t) => t.status === "concluido" || t.status === "cancelado");

  function renderCard(t: Trabalho) {
    const precisaPagar =
      t.status === "concluido" && t.forma_pagamento === "app" && !t.pago_em_app && !!t.valor_final;
    const precisaConfirmar = t.status === "concluido" && t.cliente_confirmacao === "pendente";
    return (
      <Card key={t.id} className="animate-fade-up">
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon name="phone" className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-snug text-slate-900">
                  {t.marca} {t.modelo}
                </p>
                <p className="text-sm text-slate-500">{t.tipo_reparo}</p>
              </div>
            </div>
            <Badge status={t.status}>{STATUS_LABEL[t.status]}</Badge>
          </div>

          {t.status !== "cancelado" && <Progresso status={t.status} />}

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2 text-slate-600">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0">{t.endereco}</span>
            </div>
            {t.assistencia_id && nomes[t.assistencia_id] && (
              <div className="flex items-start gap-2 text-slate-600">
                <Icon name="wrench" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">{nomes[t.assistencia_id]}</span>
              </div>
            )}
            {t.horario_preferido && (
              <div className="flex items-start gap-2 text-slate-600">
                <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{formatData(t.horario_preferido)}</span>
              </div>
            )}
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {t.valor_final ? "Valor final" : "Estimado"}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {t.valor_final ? formatBRL(t.valor_final) : t.preco_estimado !== null ? formatBRL(t.preco_estimado) : "Sob consulta"}
              </p>
              {t.status === "concluido" && t.pago_em_app && <p className="text-xs text-emerald-700">Pago pelo app</p>}
              {t.status === "concluido" && t.forma_pagamento === "presencial" && (
                <p className="text-xs text-slate-500">Pagamento presencial</p>
              )}
            </div>
            {t.status === "fila" && (
              <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => cancelar(t.id)}>
                Cancelar
              </Button>
            )}
          </div>

          {precisaPagar && (
            <div className="mt-3 rounded-xl bg-blue-50 p-3.5">
              <p className="text-sm text-blue-900">Pague pelo app com Pix ou cartão — {formatBRL(t.valor_final)}.</p>
              <Button size="md" className="mt-3 w-full" disabled={busy === t.id} onClick={() => pagar(t.id)}>
                {busy === t.id ? "Abrindo..." : "Pagar agora"}
              </Button>
            </div>
          )}

          {precisaConfirmar && contestando !== t.id && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3.5">
              <p className="text-sm text-slate-700">
                A assistência informou <span className="font-semibold">{formatBRL(t.valor_final)}</span> por este serviço.
                O valor está correto?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="md" disabled={busy === t.id} onClick={() => confirmar(t.id, true)}>
                  Está correto
                </Button>
                <Button size="md" variant="outline" onClick={() => setContestando(t.id)}>
                  Tem algo errado
                </Button>
              </div>
            </div>
          )}

          {precisaConfirmar && contestando === t.id && (
            <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3.5">
              <p className="text-sm text-slate-700">Conte o que aconteceu (valor diferente, serviço não feito…):</p>
              <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Button size="md" disabled={busy === t.id || !motivo.trim()} onClick={() => confirmar(t.id, false)}>
                  Enviar
                </Button>
                <Button size="md" variant="ghost" onClick={() => setContestando(null)}>
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
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <PageHeader
        title="Meus reparos"
        action={
          <Link href="/agendar">
            <Button size="sm">
              <Icon name="plus" className="h-4 w-4" />
              Novo
            </Button>
          </Link>
        }
      />

      {pagamentoRetorno === "ok" && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          Pagamento recebido! Em instantes ele aparece confirmado aqui.
        </p>
      )}
      {pagamentoRetorno === "pendente" && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          Seu pagamento está em análise. Assim que o Mercado Pago confirmar, ele aparece aqui.
        </p>
      )}
      {pagamentoRetorno === "falhou" && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          O pagamento não foi concluído. Você pode tentar de novo no botão abaixo.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>
      )}

      {trabalhos.length === 0 && (
        <EmptyState
          icon={<Icon name="clipboard" className="h-7 w-7" />}
          title="Nenhum reparo ainda"
          text="Quando você agendar um conserto, ele aparece aqui com o andamento em tempo real."
          action={
            <Link href="/agendar">
              <Button size="lg">Agendar meu reparo</Button>
            </Link>
          }
        />
      )}

      {ativos.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-slate-400">Em andamento</h2>
          <div className="space-y-3">{ativos.map(renderCard)}</div>
        </section>
      )}

      {historico.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-slate-400">Histórico</h2>
          <div className="space-y-3">{historico.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}

const ETAPAS: { status: Trabalho["status"]; label: string }[] = [
  { status: "fila", label: "Enviado" },
  { status: "aceito", label: "Aceito" },
  { status: "a_caminho", label: "A caminho" },
  { status: "em_reparo", label: "Em reparo" },
  { status: "concluido", label: "Pronto" },
];

function Progresso({ status }: { status: Trabalho["status"] }) {
  const atual = ETAPAS.findIndex((e) => e.status === status);
  return (
    <ol className="mt-4 flex items-start" aria-label="Andamento do reparo">
      {ETAPAS.map((e, i) => {
        const feito = i < atual || status === "concluido";
        const agora = i === atual && status !== "concluido";
        return (
          <li key={e.status} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                className={cn(
                  "absolute right-1/2 top-[11px] h-0.5 w-full -translate-y-1/2",
                  i <= atual || status === "concluido" ? "bg-blue-600" : "bg-slate-200"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full text-white",
                feito ? "bg-blue-600" : agora ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-200"
              )}
            >
              {feito ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /> : agora ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span className={cn("mt-1.5 text-center text-[10.5px] font-medium leading-tight", feito || agora ? "text-slate-800" : "text-slate-400")}>
              {e.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function MeusReparosPage() {
  return (
    <Suspense fallback={null}>
      <MeusReparos />
    </Suspense>
  );
}
