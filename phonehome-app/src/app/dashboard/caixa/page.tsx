"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { formatBRL, type CaixaLancamento } from "@/lib/types";

const TIPO_LABEL: Record<CaixaLancamento["tipo"], string> = {
  receita: "Receita",
  comissao_plataforma: "Comissão da plataforma",
  despesa: "Despesa",
};

export default function CaixaPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = createClient();
  const [lancamentos, setLancamentos] = useState<CaixaLancamento[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const { data } = await supabase
      .from("marketplace_caixa")
      .select("*")
      .eq("assistencia_id", assistenciaUsuario.assistencia_id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLancamentos((data as CaixaLancamento[]) ?? []);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const resumo = useMemo(() => {
    const receitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const comissao = lancamentos
      .filter((l) => l.tipo === "comissao_plataforma")
      .reduce((s, l) => s + l.valor, 0);
    const despesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
    const saldo = receitas + comissao - despesas;
    return { receitas, comissao, despesas, saldo };
  }, [lancamentos]);

  async function lancar(e: React.FormEvent) {
    e.preventDefault();
    if (!assistenciaUsuario || !valor) return;
    setBusy(true);
    const valorNum = Number(valor);
    await supabase.from("marketplace_caixa").insert({
      assistencia_id: assistenciaUsuario.assistencia_id,
      tipo,
      valor: tipo === "despesa" ? Math.abs(valorNum) : Math.abs(valorNum),
      descricao: descricao || null,
    });
    setDescricao("");
    setValor("");
    setBusy(false);
    await load();
  }

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Caixa</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-slate-500">Receitas</p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">
              {formatBRL(resumo.receitas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-slate-500">Comissão da plataforma</p>
            <p className="mt-1 text-lg font-semibold text-amber-600">
              {formatBRL(resumo.comissao)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-slate-500">Despesas</p>
            <p className="mt-1 text-lg font-semibold text-red-600">
              −{formatBRL(resumo.despesas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-slate-500">Saldo</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatBRL(resumo.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lançar despesa ou receita avulsa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={lancar} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="tipo-lanc">Tipo</Label>
              <Select id="tipo-lanc" value={tipo} onChange={(e) => setTipo(e.target.value as "despesa" | "receita")}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita avulsa</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="valor-lanc">Valor (R$)</Label>
              <Input
                id="valor-lanc"
                type="number"
                min={0}
                step="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="desc-lanc">Descrição</Label>
              <Input id="desc-lanc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy} className="w-full">
                Lançar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {lancamentos.map((l) => (
          <Card key={l.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {l.descricao || TIPO_LABEL[l.tipo]}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(l.created_at).toLocaleString("pt-BR")} · {TIPO_LABEL[l.tipo]}
                </p>
              </div>
              <p
                className={
                  l.valor < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"
                }
              >
                {formatBRL(l.valor)}
              </p>
            </CardContent>
          </Card>
        ))}
        {lancamentos.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Nenhum lançamento ainda.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
