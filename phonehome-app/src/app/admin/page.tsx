"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  MARCAS,
  TIPOS_REPARO,
  formatBRL,
  formatData,
  type Assistencia,
  type Config,
  type Preco,
  type Trabalho,
} from "@/lib/types";

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [pendentes, setPendentes] = useState<Trabalho[]>([]);
  const [contestados, setContestados] = useState<Trabalho[]>([]);
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [novo, setNovo] = useState({ marca: "*", modelo: "*", tipo_reparo: TIPOS_REPARO[0], preco: "" });

  const load = useCallback(async () => {
    const { data: ok } = await supabase.rpc("marketplace_is_admin");
    setAdmin(Boolean(ok));
    if (!ok) return;
    const [{ data: a }, { data: p }, { data: c }, { data: pr }, { data: cfg }] = await Promise.all([
      supabase.from("marketplace_assistencias").select("*").order("nome"),
      supabase
        .from("marketplace_trabalhos")
        .select("*")
        .eq("status", "concluido")
        .eq("acerto_status", "pendente")
        .order("concluido_em"),
      supabase
        .from("marketplace_trabalhos")
        .select("*")
        .eq("cliente_confirmacao", "contestado")
        .order("cliente_confirmacao_em", { ascending: false }),
      supabase.from("marketplace_precos").select("*").order("marca").order("modelo").order("tipo_reparo"),
      supabase.from("marketplace_config").select("*").maybeSingle(),
    ]);
    setAssistencias((a as Assistencia[]) ?? []);
    setPendentes((p as Trabalho[]) ?? []);
    setContestados((c as Trabalho[]) ?? []);
    setPrecos((pr as Preco[]) ?? []);
    setConfig(cfg as Config | null);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const nomeDe = (id: string | null) => assistencias.find((a) => a.id === id)?.nome ?? "—";

  async function quitar(t: Trabalho) {
    setErro(null);
    const { error } = await supabase.rpc("marketplace_admin_quitar", { p_trabalho: t.id });
    if (error) setErro(error.message);
    await load();
  }

  async function salvarAssistencia(a: Assistencia, taxa: number, status: string) {
    setErro(null);
    setMsg(null);
    const { error } = await supabase.rpc("marketplace_admin_set_assistencia", {
      p_assistencia: a.id,
      p_taxa: taxa,
      p_status: status,
    });
    if (error) setErro(error.message);
    else setMsg(`${a.nome} atualizada.`);
    await load();
  }

  async function salvarConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setErro(null);
    setMsg(null);
    const { error } = await supabase
      .from("marketplace_config")
      .update({
        comissao_padrao_pct: Number(config.comissao_padrao_pct),
        limite_comissao_pendente: Number(config.limite_comissao_pendente),
        dias_tolerancia_comissao: Number(config.dias_tolerancia_comissao),
        instrucoes_comissao: config.instrucoes_comissao,
      })
      .eq("id", (config as Config & { id?: number | string }).id as never);
    if (error) setErro(error.message);
    else setMsg("Regras salvas.");
  }

  async function adicionarPreco(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const { error } = await supabase.from("marketplace_precos").insert({
      marca: novo.marca.trim() || "*",
      modelo: novo.modelo.trim() || "*",
      tipo_reparo: novo.tipo_reparo,
      preco: Number(novo.preco),
    });
    if (error) setErro(error.message);
    else setNovo({ ...novo, preco: "" });
    await load();
  }

  async function atualizarPreco(p: Preco, campos: Partial<Preco>) {
    await supabase.from("marketplace_precos").update(campos).eq("id", p.id);
    await load();
  }

  async function removerPreco(p: Preco) {
    await supabase.from("marketplace_precos").delete().eq("id", p.id);
    await load();
  }

  if (admin === null) return <p className="p-6 text-sm text-slate-500">Carregando…</p>;
  if (!admin)
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-slate-700">Esta área é só para a equipe da plataforma.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Voltar ao início
        </Link>
      </div>
    );

  const totalPendente = pendentes.reduce((s, t) => s + Number(t.comissao_valor ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Administração da plataforma</h1>
      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {msg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Acertos de comissão pendentes — {formatBRL(totalPendente)}</CardTitle>
        </CardHeader>
        <CardContent>
          {pendentes.length === 0 && <p className="text-sm text-slate-500">Nada pendente.</p>}
          <ul className="space-y-2">
            {pendentes.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {nomeDe(t.assistencia_id)} · {t.marca} {t.modelo} — {t.tipo_reparo}
                  </p>
                  <p className="text-xs text-slate-500">
                    Concluído em {formatData(t.concluido_em)} · valor {formatBRL(t.valor_final)} ·{" "}
                    {t.forma_pagamento === "app"
                      ? t.pago_em_app
                        ? "pago no app (repassar líquido à assistência)"
                        : "no app, ainda não pago"
                      : "presencial (assistência deve a comissão)"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">{formatBRL(t.comissao_valor)}</span>
                  <Button size="sm" variant="outline" onClick={() => quitar(t)}>
                    Marcar como quitado
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Valores contestados pelos clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {contestados.length === 0 && <p className="text-sm text-slate-500">Nenhuma contestação.</p>}
          <ul className="space-y-2">
            {contestados.map((t) => (
              <li key={t.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <p className="font-medium text-amber-900">
                  {nomeDe(t.assistencia_id)} · {t.marca} {t.modelo} — {t.tipo_reparo} · declarado {formatBRL(t.valor_final)}
                </p>
                <p className="text-amber-800">Motivo do cliente: “{t.cliente_motivo}”</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Regras de comissão</CardTitle>
        </CardHeader>
        <CardContent>
          {config && (
            <form onSubmit={salvarConfig} className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="cfg-pct">Comissão padrão (%)</Label>
                <Input
                  id="cfg-pct"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={config.comissao_padrao_pct}
                  onChange={(e) => setConfig({ ...config, comissao_padrao_pct: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cfg-lim">Bloquear aceite acima de (R$ pendente)</Label>
                <Input
                  id="cfg-lim"
                  type="number"
                  min={0}
                  value={config.limite_comissao_pendente}
                  onChange={(e) => setConfig({ ...config, limite_comissao_pendente: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cfg-dias">…ou comissão parada há (dias)</Label>
                <Input
                  id="cfg-dias"
                  type="number"
                  min={1}
                  value={config.dias_tolerancia_comissao}
                  onChange={(e) => setConfig({ ...config, dias_tolerancia_comissao: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="cfg-inst">Como a assistência paga a comissão (Pix, dados bancários…)</Label>
                <Textarea
                  id="cfg-inst"
                  rows={3}
                  value={config.instrucoes_comissao}
                  onChange={(e) => setConfig({ ...config, instrucoes_comissao: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit">Salvar regras</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assistências cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assistencias.map((a) => (
              <LinhaAssistencia key={a.id} a={a} onSalvar={salvarAssistencia} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de preços (estimativa na hora para o cliente)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-slate-500">
            Use * em marca/modelo para valer para todos. O preço mais específico (marca + modelo) vence.
          </p>
          <form onSubmit={adicionarPreco} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div>
              <Label htmlFor="n-marca">Marca</Label>
              <Select id="n-marca" value={novo.marca} onChange={(e) => setNovo({ ...novo, marca: e.target.value })}>
                <option value="*">Todas (*)</option>
                {MARCAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="n-mod">Modelo</Label>
              <Input id="n-mod" value={novo.modelo} onChange={(e) => setNovo({ ...novo, modelo: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="n-tipo">Reparo</Label>
              <Select id="n-tipo" value={novo.tipo_reparo} onChange={(e) => setNovo({ ...novo, tipo_reparo: e.target.value })}>
                {TIPOS_REPARO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="n-preco">Preço (R$)</Label>
              <Input id="n-preco" type="number" min={0} step="0.01" required value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Adicionar
              </Button>
            </div>
          </form>
          <ul className="space-y-1 text-sm">
            {precos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-slate-50">
                <span className={p.ativo ? "text-slate-800" : "text-slate-400 line-through"}>
                  {p.marca === "*" ? "Todas as marcas" : p.marca} · {p.modelo === "*" ? "todos os modelos" : p.modelo} · {p.tipo_reparo}
                </span>
                <span className="flex items-center gap-2">
                  <Input
                    className="h-8 w-28"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={p.preco}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v >= 0 && v !== Number(p.preco)) atualizarPreco(p, { preco: v });
                    }}
                  />
                  <button className="text-xs text-slate-500 hover:underline" onClick={() => atualizarPreco(p, { ativo: !p.ativo })}>
                    {p.ativo ? "desativar" : "ativar"}
                  </button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => removerPreco(p)}>
                    excluir
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function LinhaAssistencia({
  a,
  onSalvar,
}: {
  a: Assistencia;
  onSalvar: (a: Assistencia, taxa: number, status: string) => void;
}) {
  const [taxa, setTaxa] = useState(String(a.taxa_comissao_pct));
  const [status, setStatus] = useState<string>(a.status);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <div>
        <p className="font-medium text-slate-900">
          {a.nome} <Badge status={a.status}>{a.status}</Badge>
        </p>
        <p className="text-xs text-slate-500">
          {a.endereco ?? "sem endereço"} · raio {a.raio_atendimento_km} km · desde {formatData(a.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input className="h-8 w-20" type="number" min={0} max={100} step="0.1" value={taxa} onChange={(e) => setTaxa(e.target.value)} />
        <span className="text-xs text-slate-500">%</span>
        <Select className="h-8 w-28" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ativa">ativa</option>
          <option value="pausada">pausada</option>
        </Select>
        <Button size="sm" variant="outline" onClick={() => onSalvar(a, Number(taxa), status)}>
          Salvar
        </Button>
      </div>
    </li>
  );
}
