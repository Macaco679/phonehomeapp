"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
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

  const visiveis = trabalhos.filter((t) => !soMeus || t.tecnico_id === assistenciaUsuario.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Ordens de serviço</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={soMeus} onChange={(e) => setSoMeus(e.target.checked)} />
          Só os meus
        </label>
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      {visiveis.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhuma OS ainda. Aceite trabalhos na fila para eles aparecerem aqui.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {visiveis.map((t) => {
          const encerrada = t.status === "concluido" || t.status === "cancelado";
          const pecasDaOs = pecas.filter((p) => p.trabalho_id === t.id);
          const cli = clientes[t.cliente_id];
          return (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {t.marca} {t.modelo} — {t.tipo_reparo}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                    {cli && (
                      <p className="mt-1 text-sm text-slate-500">
                        Cliente: {cli.nome ?? "—"}
                        {cli.telefone ? ` · ${cli.telefone}` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">
                      {t.valor_final ? formatBRL(t.valor_final) : formatBRL(t.preco_estimado)}
                      {t.status === "concluido" && (
                        <>
                          {" · "}
                          {t.forma_pagamento === "app"
                            ? t.pago_em_app
                              ? "pago pelo app"
                              : "aguardando pagamento no app"
                            : "pagamento presencial"}
                        </>
                      )}
                    </p>
                    {t.status === "concluido" && t.cliente_confirmacao === "contestado" && (
                      <p className="mt-1 text-sm text-amber-700">
                        O cliente contestou o valor: “{t.cliente_motivo}”. A plataforma vai entrar em contato.
                      </p>
                    )}
                    {t.status === "concluido" && t.cliente_confirmacao === "confirmado" && (
                      <p className="mt-1 text-xs text-emerald-700">Valor confirmado pelo cliente.</p>
                    )}
                  </div>
                  <Badge status={t.status}>{STATUS_LABEL[t.status]}</Badge>
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
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
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
                      <div className="mt-2 grid grid-cols-[1fr_70px_auto] gap-2">
                        <Select value={pecaEscolhida} onChange={(e) => setPecaEscolhida(e.target.value)}>
                          <option value="">Escolher peça do estoque…</option>
                          {estoque.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.peca}
                              {e.modelo_compativel ? ` (${e.modelo_compativel})` : ""} — {e.quantidade} em estoque
                            </option>
                          ))}
                        </Select>
                        <Input type="number" min={1} value={pecaQtd} onChange={(e) => setPecaQtd(e.target.value)} />
                        <Button size="sm" variant="outline" disabled={busy || !pecaEscolhida} onClick={() => adicionarPeca(t)}>
                          Lançar
                        </Button>
                      </div>
                    )}
                  </div>
                )}

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
                      Finalizar e registrar valor
                    </Button>
                  </div>
                )}

                {finalizando === t.id && (
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
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
                    <p className="col-span-2 text-xs text-slate-500">
                      O cliente vai confirmar este valor no app. Depois de concluir, o valor não pode mais ser alterado.
                      A comissão da plataforma é calculada automaticamente.
                    </p>
                    <div className="col-span-2 flex gap-2">
                      <Button size="sm" disabled={busy} onClick={() => finalizar(t)}>
                        Confirmar e concluir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setFinalizando(null)}>
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
