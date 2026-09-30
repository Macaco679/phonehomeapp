"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Input, Select, Label } from "@/components/ui/input";
import {
  STATUS_LABEL,
  formatBRL,
  type Cliente,
  type EstoqueItem,
  type StatusTrabalho,
  type Trabalho,
  type TrabalhoPeca,
  type UsuarioAssistencia,
} from "@/lib/types";

const PROXIMO_STATUS: Partial<Record<StatusTrabalho, StatusTrabalho>> = {
  aceito: "a_caminho",
  a_caminho: "em_reparo",
};

export default function OrdensDeServicoPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [equipe, setEquipe] = useState<UsuarioAssistencia[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [pecas, setPecas] = useState<TrabalhoPeca[]>([]);
  const [clientes, setClientes] = useState<Record<string, Cliente>>({});
  const [soMeus, setSoMeus] = useState(false);
  const [aba, setAba] = useState<"andamento" | "todas">("andamento");
  const [finalizando, setFinalizando] = useState<string | null>(null);
  const [valorFinal, setValorFinal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"app" | "presencial">("presencial");
  const [pecaEscolhida, setPecaEscolhida] = useState("");
  const [pecaQtd, setPecaQtd] = useState("1");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const aid = assistenciaUsuario.assistencia_id;
    const [{ data: t }, { data: eq }, { data: es }] = await Promise.all([
      supabase.from("marketplace_trabalhos").select("*").eq("assistencia_id", aid).order("created_at", { ascending: false }),
      supabase.from("marketplace_usuarios").select("*").eq("assistencia_id", aid),
      supabase.from("marketplace_estoque").select("*").eq("assistencia_id", aid).order("peca"),
    ]);
    const lista = (t as Trabalho[]) ?? [];
    setTrabalhos(lista);
    setEquipe((eq as UsuarioAssistencia[]) ?? []);
    setEstoque((es as EstoqueItem[]) ?? []);
    if (lista.length) {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("marketplace_trabalho_pecas").select("*").in("trabalho_id", lista.map((x) => x.id)),
        supabase.from("marketplace_clientes").select("*").in("id", Array.from(new Set(lista.map((x) => x.cliente_id)))),
      ]);
      setPecas((p as TrabalhoPeca[]) ?? []);
      setClientes(Object.fromEntries(((c as Cliente[]) ?? []).map((x) => [x.id, x])));
    }
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

  async function atualizar(id: string, campos: Partial<Trabalho>) {
    setBusy(true);
    setErro(null);
    const { error } = await supabase.from("marketplace_trabalhos").update(campos).eq("id", id);
    if (error) setErro(error.message);
    setBusy(false);
    await load();
    return !error;
  }

  async function avancar(t: Trabalho) {
    const proximo = PROXIMO_STATUS[t.status];
    if (proximo) await atualizar(t.id, { status: proximo });
  }

  async function finalizar(t: Trabalho) {
    const valor = Number(valorFinal);
    if (!valor || valor <= 0) return;
    const ok = await atualizar(t.id, {
      status: "concluido",
      valor_final: valor,
      forma_pagamento: formaPagamento,
    });
    if (ok) {
      setFinalizando(null);
      setValorFinal("");
    }
  }

  async function adicionarPeca(t: Trabalho) {
    const qtd = Number(pecaQtd);
    if (!pecaEscolhida || !qtd || qtd <= 0) return;
    setBusy(true);
    setErro(null);
    const { error } = await supabase
      .from("marketplace_trabalho_pecas")
      .insert({ trabalho_id: t.id, estoque_id: pecaEscolhida, quantidade: qtd });
    if (error) setErro(error.message);
    setPecaEscolhida("");
    setPecaQtd("1");
    setBusy(false);
    await load();
  }

  async function removerPeca(id: string) {
    await supabase.from("marketplace_trabalho_pecas").delete().eq("id", id);
    await load();
  }

  if (!assistenciaUsuario) return null;

  const visiveis = trabalhos.filter(
    (t) =>
      (!soMeus || t.tecnico_id === assistenciaUsuario.id) &&
      (aba === "todas" || (t.status !== "concluido" && t.status !== "cancelado"))
  );

  return (
    <div>
      <PageHeader title="Ordens de serviço" subtitle="Acompanhe cada reparo aceito pela sua assistência." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1">
          {(
            [
              ["andamento", "Em andamento"],
              ["todas", "Todas"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
                aba === valor ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSoMeus((v) => !v)}
          aria-pressed={soMeus}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition",
            soMeus ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200"
          )}
        >
          Só os meus
        </button>
      </div>

      {erro && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{erro}</p>
      )}

      {visiveis.length === 0 && (
        <EmptyState
          icon={<Icon name="clipboard" className="h-7 w-7" />}
          title={aba === "andamento" ? "Nenhuma OS em andamento" : "Nenhuma OS ainda"}
          text="Aceite trabalhos na fila para eles aparecerem aqui."
        />
      )}

      <div className="space-y-3">
        {visiveis.map((t) => {
          const encerrada = t.status === "concluido" || t.status === "cancelado";
          const pecasDaOs = pecas.filter((p) => p.trabalho_id === t.id);
          const cli = clientes[t.cliente_id];
          return (
            <Card key={t.id}>
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

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">{t.endereco}</span>
                  </div>
                  {cli && (
                    <div className="flex items-start gap-2">
                      <Icon name="user" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0">
                        {cli.nome ?? "—"}
                        {cli.telefone ? ` · ${cli.telefone}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {!encerrada && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.endereco)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm active:scale-95"
                    >
                      <Icon name="pin" className="h-4 w-4" />
                      Mapa
                    </a>
                    {cli?.telefone && (
                      <>
                        <a
                          href={`tel:${cli.telefone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm active:scale-95"
                        >
                          <Icon name="phone" className="h-4 w-4" />
                          Ligar
                        </a>
                        <a
                          href={`https://wa.me/${(cli.telefone.replace(/\D/g, "").length <= 11 ? "55" : "") + cli.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm active:scale-95"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {t.valor_final ? "Valor final" : "Estimado"}
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {t.valor_final ? formatBRL(t.valor_final) : t.preco_estimado !== null ? formatBRL(t.preco_estimado) : "Sob consulta"}
                  </p>
                  {t.status === "concluido" && (
                    <p className="text-xs text-slate-500">
                      {t.forma_pagamento === "app"
                        ? t.pago_em_app
                          ? "Pago pelo app"
                          : "Aguardando pagamento no app"
                        : "Pagamento presencial"}
                    </p>
                  )}
                  {t.status === "concluido" && t.cliente_confirmacao === "contestado" && (
                    <p className="mt-1 text-sm text-amber-700">
                      O cliente contestou o valor: “{t.cliente_motivo}”. A plataforma vai entrar em contato.
                    </p>
                  )}
                  {t.status === "concluido" && t.cliente_confirmacao === "confirmado" && (
                    <p className="mt-1 text-xs text-emerald-700">Valor confirmado pelo cliente.</p>
                  )}
                </div>

                {!encerrada && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`tec-${t.id}`}>Técnico responsável</Label>
                      <Select
                        id={`tec-${t.id}`}
                        value={t.tecnico_id ?? ""}
                        disabled={busy}
                        onChange={(e) => atualizar(t.id, { tecnico_id: e.target.value || null })}
                      >
                        <option value="">Sem técnico definido</option>
                        {equipe.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome ?? "Sem nome"} ({u.papel === "dono" ? "dono" : "técnico"})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                {(pecasDaOs.length > 0 || !encerrada) && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3.5">
                    <p className="text-sm font-medium text-slate-700">Peças usadas (baixa automática no estoque ao concluir)</p>
                    {pecasDaOs.length === 0 && <p className="mt-1 text-sm text-slate-500">Nenhuma peça lançada.</p>}
                    <ul className="mt-1 space-y-1">
                      {pecasDaOs.map((p) => {
                        const item = estoque.find((e) => e.id === p.estoque_id);
                        return (
                          <li key={p.id} className="flex items-center justify-between text-sm text-slate-700">
                            <span>
                              {p.quantidade}× {item?.peca ?? "Peça"}
                              {p.baixado && <span className="ml-2 text-xs text-slate-400">(baixada)</span>}
                            </span>
                            {!p.baixado && !encerrada && (
                              <button className="text-xs text-red-600 hover:underline" onClick={() => removerPeca(p.id)}>
                                remover
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {!encerrada && (
                      <div className="mt-2 grid grid-cols-[1fr_5rem] gap-2 sm:grid-cols-[1fr_70px_auto]">
                        <Select className="col-span-2 sm:col-span-1" value={pecaEscolhida} onChange={(e) => setPecaEscolhida(e.target.value)}>
                          <option value="">Escolher peça do estoque…</option>
                          {estoque.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.peca}
                              {e.modelo_compativel ? ` (${e.modelo_compativel})` : ""} — {e.quantidade} em estoque
                            </option>
                          ))}
                        </Select>
                        <Input type="number" min={1} value={pecaQtd} onChange={(e) => setPecaQtd(e.target.value)} />
                        <Button size="md" variant="outline" disabled={busy || !pecaEscolhida} onClick={() => adicionarPeca(t)}>
                          Lançar
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {PROXIMO_STATUS[t.status] && finalizando !== t.id && (
                  <div className="mt-3">
                    <Button size="lg" className="w-full" disabled={busy} onClick={() => avancar(t)}>
                      Marcar como {STATUS_LABEL[PROXIMO_STATUS[t.status]!]}
                    </Button>
                  </div>
                )}

                {t.status === "em_reparo" && finalizando !== t.id && (
                  <div className="mt-3">
                    <Button size="lg" className="w-full" onClick={() => setFinalizando(t.id)}>
                      Finalizar e registrar valor
                    </Button>
                  </div>
                )}

                {finalizando === t.id && (
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`valor-${t.id}`}>Valor final cobrado (R$)</Label>
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
                      <Label htmlFor={`pagamento-${t.id}`}>Como o cliente vai pagar</Label>
                      <Select
                        id={`pagamento-${t.id}`}
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value as "app" | "presencial")}
                      >
                        <option value="presencial">Presencial (na hora)</option>
                        <option value="app">Pelo app (Pix/cartão)</option>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      O cliente vai confirmar este valor no app. Depois de concluir, o valor não pode mais ser alterado.
                      A comissão da plataforma é calculada automaticamente.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      <Button size="md" disabled={busy} onClick={() => finalizar(t)}>
                        Confirmar e concluir
                      </Button>
                      <Button size="md" variant="ghost" onClick={() => setFinalizando(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
