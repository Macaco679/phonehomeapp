"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCarrinho } from "@/hooks/use-carrinho";
import { createClient } from "@/lib/supabase/client";
import { especificacoesDoProduto } from "@/lib/especificacoes";
import { fundoIlustracao, ilustracaoProduto } from "@/lib/ilustracoes";
import { TIPOS_PRODUTO, descontoPct, formatBRL, type Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { BASE_LOJA, type ModoLoja } from "@/components/loja/catalogo";

function Foto({ p, className }: { p: Produto; className: string }) {
  if (p.imagem_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.imagem_url} alt={p.nome} className={`${className} object-cover`} />;
  }
  return (
    <div className={`${className} p-[6%]`} style={{ background: fundoIlustracao(p.tipo) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ilustracaoProduto(p.tipo)} alt="" className="h-full w-full object-contain" />
    </div>
  );
}

/** Página do produto: fotos, preço, compra e ficha técnica completa. */
export function ProdutoDetalhe({ modo }: { modo: ModoLoja }) {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const { assistenciaUsuario, loading } = useAuth();
  const carrinho = useCarrinho(modo);
  const base = BASE_LOJA[modo];
  const [produto, setProduto] = useState<Produto | null>(null);
  const [vendedor, setVendedor] = useState<string | null>(null);
  const [relacionados, setRelacionados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [qtd, setQtd] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    if (loading || !id) return;
    (async () => {
      setCarregando(true);
      const { data } = await supabase.from("marketplace_produtos").select("*").eq("id", id).maybeSingle();
      const p = (data as Produto | null) ?? null;
      // clientes só compram acessórios
      const visivel = p && p.ativo && (modo === "assistencia" || p.categoria === "acessorio") ? p : null;
      setProduto(visivel);
      setQtd(1);
      setAdicionado(false);
      if (visivel) {
        const [{ data: ass }, { data: rel }] = await Promise.all([
          supabase.from("marketplace_assistencias").select("nome").eq("id", visivel.assistencia_id).maybeSingle(),
          (() => {
            let q = supabase
              .from("marketplace_produtos")
              .select("*")
              .eq("ativo", true)
              .gt("quantidade", 0)
              .neq("id", visivel.id)
              .eq("assistencia_id", visivel.assistencia_id);
            q = visivel.modelo_compativel ? q.eq("modelo_compativel", visivel.modelo_compativel) : q.eq("tipo", visivel.tipo ?? "outros");
            if (modo === "cliente") q = q.eq("categoria", "acessorio");
            return q.limit(4);
          })(),
        ]);
        setVendedor(ass?.nome ?? null);
        setRelacionados((rel as Produto[]) ?? []);
      }
      setCarregando(false);
    })();
  }, [id, loading, modo, supabase]);

  const wrapper = modo === "cliente" ? "mx-auto max-w-5xl px-4 py-8" : "";

  if (carregando) return <div className={wrapper}><p className="text-sm text-slate-500">Carregando…</p></div>;

  if (!produto) {
    return (
      <div className={wrapper}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-slate-900">Produto não encontrado</p>
            <p className="mt-1 text-sm text-slate-500">Ele pode ter esgotado ou não estar disponível para a sua conta.</p>
            <Link href={base} className="mt-4 inline-block">
              <Button variant="outline">Voltar para a loja</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = produto;
  const desconto = descontoPct(p);
  const daMinhaLoja = assistenciaUsuario?.assistencia_id === p.assistencia_id;
  const specs = especificacoesDoProduto(p);
  const tipoLabel = TIPOS_PRODUTO.find((t) => t.valor === p.tipo)?.label ?? (p.categoria === "peca" ? "Peça" : "Acessório");
  const noCarrinho = carrinho.itens.find((i) => i.produto_id === p.id)?.quantidade ?? 0;
  const maxAdicionar = Math.max(0, p.quantidade - noCarrinho);

  function adicionar() {
    for (let i = 0; i < qtd; i++) {
      carrinho.adicionar({ produto_id: p.id, assistencia_id: p.assistencia_id, nome: p.nome, preco: Number(p.preco), max: p.quantidade });
    }
    setAdicionado(true);
  }

  return (
    <div className={wrapper}>
      <Link href={base} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
        ← Voltar para a loja
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative">
          <Foto p={p} className="aspect-[4/3] w-full rounded-2xl" />
          {desconto > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-sm font-bold text-white">
              -{desconto}%
            </span>
          )}
        </div>

        <div>
          <Badge>{tipoLabel}</Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{p.nome}</h1>
          {p.modelo_compativel && <p className="mt-1 text-sm text-slate-500">Compatível: {p.modelo_compativel}</p>}
          {vendedor && <p className="mt-1 text-xs text-slate-400">Vendido por {vendedor}</p>}

          <div className="mt-4">
            {desconto > 0 && <p className="text-sm text-slate-400 line-through">{formatBRL(Number(p.preco_de))}</p>}
            <p className="text-3xl font-bold text-slate-900">{formatBRL(Number(p.preco))}</p>
            <p className="mt-1 text-xs text-slate-500">Pix ou cartão · {p.quantidade} em estoque</p>
          </div>

          {daMinhaLoja ? (
            <p className="mt-5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
              Este produto é da sua loja.{" "}
              <Link href="/dashboard/loja" className="font-semibold text-blue-600">Editar em Vender produtos</Link>
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Qtd.
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, maxAdicionar)}
                  value={qtd}
                  onChange={(e) => setQtd(Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(1, maxAdicionar)))}
                  className="h-11 w-16 rounded-xl border border-slate-300 px-2 text-center"
                />
              </label>
              <Button size="lg" disabled={maxAdicionar === 0} onClick={adicionar}>
                {maxAdicionar === 0 ? "Limite do estoque no carrinho" : "Adicionar ao carrinho"}
              </Button>
              {(adicionado || noCarrinho > 0) && (
                <Link href={`${base}#carrinho`}>
                  <Button size="lg" variant="outline">Ir para o carrinho ({carrinho.quantidadeTotal})</Button>
                </Link>
              )}
            </div>
          )}

          {p.descricao && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900">Descrição</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.descricao}</p>
            </div>
          )}
        </div>
      </div>

      <Card className="mt-8">
        <CardContent>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Ficha técnica</h2>
          <dl className="divide-y divide-slate-100">
            {specs.map((e) => (
              <div key={e.rotulo} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-3 py-2.5 text-sm">
                <dt className="text-slate-500">{e.rotulo}</dt>
                <dd className="font-medium text-slate-900">{e.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Peça/acessório compatível (não é produto original da Apple). Dados do aparelho conforme especificação de fábrica.
          </p>
        </CardContent>
      </Card>

      {relacionados.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {p.modelo_compativel ? `Mais para ${p.modelo_compativel}` : "Produtos parecidos"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relacionados.map((r) => (
              <Link key={r.id} href={`${base}/${r.id}`} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-blue-300">
                <Foto p={r} className="h-24 w-full rounded-lg" />
                <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">{r.nome}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatBRL(Number(r.preco))}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
