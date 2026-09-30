"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  STATUS_PEDIDO_LABEL,
  formatBRL,
  formatData,
  type Pedido,
  type PedidoItem,
  type Produto,
  type StatusPedido,
} from "@/lib/types";

const VAZIO = { nome: "", descricao: "", categoria: "peca", modelo_compativel: "", preco: "", quantidade: "0", imagem_url: "" };

const PROXIMOS: Partial<Record<StatusPedido, StatusPedido>> = {
  pago: "enviado",
  enviado: "entregue",
};

export default function LojaDashboardPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const aid = assistenciaUsuario.assistencia_id;
    const [{ data: p }, { data: ped }] = await Promise.all([
      supabase.from("marketplace_produtos").select("*").eq("assistencia_id", aid).order("created_at", { ascending: false }),
      supabase.from("marketplace_pedidos").select("*").eq("assistencia_id", aid).order("created_at", { ascending: false }),
    ]);
    const lista = (ped as Pedido[]) ?? [];
    if (lista.length) {
      const { data: itens } = await supabase
        .from("marketplace_pedido_itens")
        .select("*")
        .in("pedido_id", lista.map((x) => x.id));
      const porPedido: Record<string, PedidoItem[]> = {};
      ((itens as PedidoItem[]) ?? []).forEach((i) => (porPedido[i.pedido_id] ||= []).push(i));
      lista.forEach((x) => (x.itens = porPedido[x.id] ?? []));
    }
    setProdutos((p as Produto[]) ?? []);
    setPedidos(lista);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function editar(p: Produto) {
    setEditando(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      categoria: p.categoria,
      modelo_compativel: p.modelo_compativel ?? "",
      preco: String(p.preco),
      quantidade: String(p.quantidade),
      imagem_url: p.imagem_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!assistenciaUsuario) return;
    setBusy(true);
    setErro(null);
    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      categoria: form.categoria,
      modelo_compativel: form.modelo_compativel.trim() || null,
      preco: Number(form.preco),
      quantidade: Math.max(0, Math.floor(Number(form.quantidade) || 0)),
      imagem_url: form.imagem_url.trim() || null,
    };
    const { error } = editando
      ? await supabase.from("marketplace_produtos").update(dados).eq("id", editando)
      : await supabase.from("marketplace_produtos").insert({ ...dados, assistencia_id: assistenciaUsuario.assistencia_id });
    if (error) setErro(error.message);
    else {
      setForm(VAZIO);
      setEditando(null);
    }
    setBusy(false);
    await load();
  }

  async function alternarAtivo(p: Produto) {
    await supabase.from("marketplace_produtos").update({ ativo: !p.ativo }).eq("id", p.id);
    await load();
  }

  async function excluir(p: Produto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    const { error } = await supabase.from("marketplace_produtos").delete().eq("id", p.id);
    if (error) setErro("Não foi possível excluir (o produto já tem pedidos). Desative-o em vez disso.");
    await load();
  }

  async function atualizarPedido(id: string, status: StatusPedido) {
    setErro(null);
    const { error } = await supabase.rpc("marketplace_atualizar_pedido", { p_id: id, p_status: status });
    if (error) setErro(error.message);
    await load();
  }

  if (!assistenciaUsuario) return null;
  const campo = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Loja de peças e acessórios</h1>
      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editando ? "Editar produto" : "Novo produto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-nome">Nome</Label>
              <Input id="p-nome" required value={form.nome} onChange={campo("nome")} />
            </div>
            <div>
              <Label htmlFor="p-cat">Categoria</Label>
              <Select id="p-cat" value={form.categoria} onChange={campo("categoria")}>
                <option value="peca">Peça</option>
                <option value="acessorio">Acessório</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-mod">Modelo compatível (opcional)</Label>
              <Input id="p-mod" value={form.modelo_compativel} onChange={campo("modelo_compativel")} placeholder="iPhone 13" />
            </div>
            <div>
              <Label htmlFor="p-img">Link da foto (opcional)</Label>
              <Input id="p-img" type="url" value={form.imagem_url} onChange={campo("imagem_url")} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="p-preco">Preço (R$)</Label>
              <Input id="p-preco" type="number" min={0} step="0.01" required value={form.preco} onChange={campo("preco")} />
            </div>
            <div>
              <Label htmlFor="p-qtd">Quantidade em estoque</Label>
              <Input id="p-qtd" type="number" min={0} required value={form.quantidade} onChange={campo("quantidade")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea id="p-desc" rows={2} value={form.descricao} onChange={campo("descricao")} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy}>
                {editando ? "Salvar alterações" : "Adicionar produto"}
              </Button>
              {editando && (
                <Button type="button" variant="ghost" onClick={() => { setEditando(null); setForm(VAZIO); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-2 text-lg font-semibold text-slate-900">Pedidos recebidos</h2>
      <div className="mb-8 space-y-2">
        {pedidos.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">Nenhum pedido ainda.</CardContent>
          </Card>
        )}
        {pedidos.map((p) => (
          <Card key={p.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {formatBRL(p.total)} <span className="text-xs font-normal text-slate-400">· {formatData(p.created_at)}</span>
                  </p>
                  <ul className="mt-1 text-sm text-slate-600">
                    {(p.itens ?? []).map((i) => (
                      <li key={i.id}>
                        {i.quantidade}× {i.nome}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm text-slate-500">Entregar em: {p.endereco_entrega}</p>
                  {p.observacao && <p className="text-sm text-slate-500">Obs.: {p.observacao}</p>}
                </div>
                <Badge>{STATUS_PEDIDO_LABEL[p.status]}</Badge>
              </div>
              {PROXIMOS[p.status] && (
                <Button size="sm" className="mt-3" onClick={() => atualizarPedido(p.id, PROXIMOS[p.status]!)}>
                  Marcar como {STATUS_PEDIDO_LABEL[PROXIMOS[p.status]!].toLowerCase()}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900">Meus produtos</h2>
      <div className="space-y-2">
        {produtos.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">
                  {p.nome} {!p.ativo && <span className="text-xs text-slate-400">(oculto na loja)</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {formatBRL(p.preco)} · {p.quantidade} em estoque · {p.categoria === "peca" ? "Peça" : "Acessório"}
                  {p.modelo_compativel ? ` · ${p.modelo_compativel}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => editar(p)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => alternarAtivo(p)}>{p.ativo ? "Ocultar" : "Mostrar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => excluir(p)}>Excluir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {produtos.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">Nenhum produto cadastrado.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
