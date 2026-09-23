"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { formatBRL, type EstoqueItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EstoquePage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = createClient();
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [peca, setPeca] = useState("");
  const [modelo, setModelo] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [minima, setMinima] = useState("2");
  const [precoVenda, setPrecoVenda] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const { data } = await supabase
      .from("marketplace_estoque")
      .select("*")
      .eq("assistencia_id", assistenciaUsuario.assistencia_id)
      .order("peca", { ascending: true });
    setItens((data as EstoqueItem[]) ?? []);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!assistenciaUsuario || !peca) return;
    setBusy(true);
    await supabase.from("marketplace_estoque").insert({
      assistencia_id: assistenciaUsuario.assistencia_id,
      peca,
      modelo_compativel: modelo || null,
      quantidade: Number(quantidade) || 0,
      quantidade_minima: Number(minima) || 2,
      preco_venda: precoVenda ? Number(precoVenda) : null,
    });
    setPeca("");
    setModelo("");
    setQuantidade("0");
    setPrecoVenda("");
    setBusy(false);
    await load();
  }

  async function ajustar(item: EstoqueItem, delta: number) {
    const nova = Math.max(0, item.quantidade + delta);
    await supabase
      .from("marketplace_estoque")
      .update({ quantidade: nova, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    await load();
  }

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Estoque</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar peça</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionar} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="peca">Peça</Label>
              <Input id="peca" required value={peca} onChange={(e) => setPeca(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="modelo-compat">Modelo compatível</Label>
              <Input
                id="modelo-compat"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qtd">Quantidade</Label>
              <Input
                id="qtd"
                type="number"
                min={0}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qtd-min">Estoque mínimo</Label>
              <Input
                id="qtd-min"
                type="number"
                min={0}
                value={minima}
                onChange={(e) => setMinima(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <Label htmlFor="preco-venda">Preço de venda (opcional)</Label>
              <Input
                id="preco-venda"
                type="number"
                min={0}
                step="0.01"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy} className="w-full">
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {itens.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {item.peca}
                  {item.modelo_compativel && (
                    <span className="text-slate-400"> · {item.modelo_compativel}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatBRL(item.preco_venda)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    item.quantidade <= item.quantidade_minima
                      ? "text-red-600"
                      : "text-slate-900"
                  )}
                >
                  {item.quantidade} un.
                </span>
                <Button size="sm" variant="outline" onClick={() => ajustar(item, -1)}>
                  −1
                </Button>
                <Button size="sm" variant="outline" onClick={() => ajustar(item, 1)}>
                  +1
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {itens.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Nenhuma peça cadastrada ainda.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
