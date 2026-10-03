"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCarrinho } from "@/hooks/use-carrinho";
import { PageHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { fundoIlustracao, ilustracaoProduto } from "@/lib/ilustracoes";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { TIPOS_PRODUTO, descontoPct, familiasDoModelo, formatBRL, type Produto } from "@/lib/types";

const ORDEM_TIPO = Object.fromEntries(TIPOS_PRODUTO.map((t, i) => [t.valor, i]));
const ORDEM_FAMILIA = ["XR", "SE", "11", "12", "13", "14", "15", "16", "17"];

export type ModoLoja = "cliente" | "assistencia";

/** Endereço da vitrine de cada modo (lista e página do produto). */
export const BASE_LOJA: Record<ModoLoja, string> = { cliente: "/loja", assistencia: "/dashboard/pecas" };

/**
 * Vitrine + carrinho.
 * - cliente: só acessórios (o banco também só libera acessórios para clientes);
 * - assistencia: peças e acessórios das outras assistências, compra B2B.
 */
export function Catalogo({ modo }: { modo: ModoLoja }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { cliente, assistenciaUsuario, loading } = useAuth();
  const carrinho = useCarrinho(modo);
  const base = BASE_LOJA[modo];
  const minhaAssistencia = assistenciaUsuario?.assistencia_id ?? null;
  const podeComprar = modo === "cliente" ? Boolean(cliente) : Boolean(assistenciaUsuario);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendedores, setVendedores] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [familia, setFamilia] = useState("");
  const [ordem, setOrdem] = useState("relevancia");
  const [endereco, setEndereco] = useState("");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    (async () => {
      let q = supabase.from("marketplace_produtos").select("*").eq("ativo", true).gt("quantidade", 0);
      if (modo === "cliente") q = q.eq("categoria", "acessorio");
      else if (minhaAssistencia) q = q.neq("assistencia_id", minhaAssistencia); // não compra de si mesma
      const { data } = await q.order("created_at", { ascending: false });
      const lista = (data as Produto[]) ?? [];
      setProdutos(lista);
      const ids = Array.from(new Set(lista.map((p) => p.assistencia_id)));
      if (ids.length) {
        // nomes dos vendedores só aparecem para quem está logado (regra do banco)
        const { data: ass } = await supabase.from("marketplace_assistencias").select("id, nome").in("id", ids);
        setVendedores(Object.fromEntries((ass ?? []).map((a) => [a.id, a.nome])));
      }
      setCarregando(false);
    })();
  }, [supabase, loading, modo, minhaAssistencia]);

  // assistência: já sugere o endereço cadastrado para a entrega
  useEffect(() => {
    if (modo !== "assistencia" || !minhaAssistencia) return;
    supabase
      .from("marketplace_assistencias")
      .select("endereco")
      .eq("id", minhaAssistencia)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.endereco) setEndereco((atual) => atual || data.endereco);
      });
  }, [modo, minhaAssistencia, supabase]);

  // só mostra os tipos e modelos que existem no catálogo
  const tiposDisponiveis = TIPOS_PRODUTO.filter((t) => produtos.some((p) => p.tipo === t.valor));
  const familias = useMemo(() => {
    const todas = new Set(produtos.flatMap((p) => familiasDoModelo(p.modelo_compativel)));
    return ORDEM_FAMILIA.filter((f) => todas.has(f));
  }, [produtos]);

  const filtrados = produtos
    .filter((p) => {
      const texto = `${p.nome} ${p.descricao ?? ""} ${p.modelo_compativel ?? ""}`.toLowerCase();
      const fams = familiasDoModelo(p.modelo_compativel);
      return (
        (!busca || texto.includes(busca.toLowerCase())) &&
        (!tipo || (tipo === "ofertas" ? descontoPct(p) > 0 : p.tipo === tipo)) &&
        // acessório universal (sem modelo) aparece em qualquer modelo
        (!familia || fams.length === 0 || fams.includes(familia))
      );
    })
    .sort((a, b) => {
      if (ordem === "menor") return a.preco - b.preco;
      if (ordem === "maior") return b.preco - a.preco;
      if (ordem === "desconto") return descontoPct(b) - descontoPct(a);
      const ta = ORDEM_TIPO[a.tipo ?? "outros"] ?? 99;
      const tb = ORDEM_TIPO[b.tipo ?? "outros"] ?? 99;
      if (ta !== tb) return ta - tb;
      const fa = ORDEM_FAMILIA.indexOf(familiasDoModelo(a.modelo_compativel)[0] ?? "");
      const fb = ORDEM_FAMILIA.indexOf(familiasDoModelo(b.modelo_compativel)[0] ?? "");
      if (fa !== fb) return fb - fa; // modelos mais novos primeiro
      return a.preco - b.preco;
    });

  // carrinho agrupado por vendedor (um pedido por vendedor)
  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof carrinho.itens>();
    carrinho.itens.forEach((i) => {
      mapa.set(i.assistencia_id, [...(mapa.get(i.assistencia_id) ?? []), i]);
    });
    return Array.from(mapa.entries());
  }, [carrinho.itens]);

  async function finalizar() {
    if (!podeComprar) return;
    setEnviando(true);
    setErro(null);
    const ids: string[] = [];
    for (const [assistenciaId, itens] of grupos) {
      const rpc = modo === "cliente" ? "marketplace_criar_pedido" : "marketplace_criar_pedido_assistencia";
      const { data, error } = await supabase.rpc(rpc, {
        p_assistencia: assistenciaId,
        p_itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
        p_endereco: endereco,
        p_obs: obs || null,
      });
      if (error) {
        setErro(error.message);
        setEnviando(false);
        return;
      }
      ids.push(data as string);
    }
    carrinho.limpar();
    setEnviando(false);
    router.push(modo === "cliente" ? "/meus-pedidos?novo=1" : "/dashboard/compras?novo=1");
  }

  return (
    <div className={modo === "cliente" ? "mx-auto max-w-6xl px-4 py-10" : ""}>
      {modo === "cliente" ? (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loja de acessórios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Películas, capas, cabos, carregadores e fones para iPhone. Pague com Pix ou cartão.
          </p>
        </>
      ) : (
        <PageHeader
          title="Comprar peças"
          subtitle="Peças e acessórios para a sua assistência, entregues no seu endereço. Pague com Pix ou cartão."
          action={
            <Link href="/dashboard/compras">
              <Button size="sm" variant="outline">Minhas compras</Button>
            </Link>
          }
        />
      )}

      <div className={modo === "cliente" ? "mt-6 grid gap-6 lg:grid-cols-[1fr_320px]" : "grid gap-6 xl:grid-cols-[1fr_300px]"}>
        {/* min-w-0: sem isso a fileira de filtros alarga a coluna e empurra o carrinho para fora da tela */}
        <div className="min-w-0">
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_170px_170px]">
            <Input placeholder="Buscar produto ou modelo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <Select value={familia} onChange={(e) => setFamilia(e.target.value)} aria-label="Modelo do iPhone">
              <option value="">Todos os modelos</option>
              {familias.map((f) => (
                <option key={f} value={f}>
                  iPhone {f}
                </option>
              ))}
            </Select>
            <Select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar">
              <option value="relevancia">Relevância</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="desconto">Maior desconto</option>
            </Select>
          </div>

          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ valor: "", label: "Tudo" }, { valor: "ofertas", label: "Ofertas" }, ...tiposDisponiveis].map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition " +
                  (tipo === t.valor
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {!carregando && produtos.length > 0 && (
            <p className="mb-3 text-xs text-slate-500">
              {filtrados.length} {filtrados.length === 1 ? "produto" : "produtos"}
            </p>
          )}

          {carregando && <p className="text-sm text-slate-500">Carregando…</p>}
          {!carregando && filtrados.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Nenhum produto disponível no momento.
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {filtrados.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex h-full flex-col">
                  <Link href={`${base}/${p.id}`} className="relative mb-3 block" aria-label={`Ver detalhes de ${p.nome}`}>
                    {p.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagem_url} alt="" loading="lazy" className="h-36 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="h-36 w-full rounded-lg p-3" style={{ background: fundoIlustracao(p.tipo) }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ilustracaoProduto(p.tipo)} alt="" loading="lazy" className="h-full w-full object-contain" />
                      </div>
                    )}
                    {descontoPct(p) > 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                        -{descontoPct(p)}%
                      </span>
                    )}
                  </Link>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`${base}/${p.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                      {p.nome}
                    </Link>
                    <Badge>{TIPOS_PRODUTO.find((t) => t.valor === p.tipo)?.label ?? (p.categoria === "peca" ? "Peça" : "Acessório")}</Badge>
                  </div>
                  {p.modelo_compativel && (
                    <p className="mt-1 text-xs text-slate-500">Compatível: {p.modelo_compativel}</p>
                  )}
                  {p.descricao && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.descricao}</p>}
                  <Link href={`${base}/${p.id}`} className="mt-1 text-xs font-semibold text-blue-600 hover:underline">
                    Ver ficha técnica
                  </Link>
                  {vendedores[p.assistencia_id] && (
                    <p className="mt-1 text-xs text-slate-400">Vendido por {vendedores[p.assistencia_id]}</p>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div>
                      {descontoPct(p) > 0 && (
                        <p className="text-xs text-slate-400 line-through">{formatBRL(Number(p.preco_de))}</p>
                      )}
                      <p className="text-lg font-semibold text-slate-900">{formatBRL(Number(p.preco))}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        carrinho.adicionar({
                          produto_id: p.id,
                          assistencia_id: p.assistencia_id,
                          nome: p.nome,
                          preco: Number(p.preco),
                          max: p.quantidade,
                        })
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside id="carrinho" className="scroll-mt-4">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle>Carrinho ({carrinho.quantidadeTotal})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {carrinho.itens.length === 0 && <p className="text-sm text-slate-500">Seu carrinho está vazio.</p>}

              {grupos.map(([assistenciaId, itens]) => (
                <div key={assistenciaId} className="space-y-2">
                  {grupos.length > 1 && (
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {vendedores[assistenciaId] ?? "Vendedor"}
                    </p>
                  )}
                  {itens.map((i) => (
                    <div key={i.produto_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex-1 truncate text-slate-700">{i.nome}</span>
                      <input
                        type="number"
                        min={0}
                        max={i.max}
                        value={i.quantidade}
                        onChange={(e) => carrinho.alterarQuantidade(i.produto_id, Number(e.target.value))}
                        className="h-8 w-14 rounded border border-slate-300 px-2 text-center"
                        aria-label={`Quantidade de ${i.nome}`}
                      />
                      <span className="w-20 text-right text-slate-900">{formatBRL(i.preco * i.quantidade)}</span>
                    </div>
                  ))}
                </div>
              ))}

              {carrinho.itens.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-slate-100 pt-3 font-medium text-slate-900">
                    <span>Total</span>
                    <span>{formatBRL(carrinho.total)}</span>
                  </div>

                  {podeComprar ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="entrega">Endereço de entrega</Label>
                        <Textarea
                          id="entrega"
                          rows={2}
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                          placeholder="Rua, número, bairro, cidade"
                        />
                      </div>
                      <div>
                        <Label htmlFor="obs">Observação (opcional)</Label>
                        <Input id="obs" value={obs} onChange={(e) => setObs(e.target.value)} />
                      </div>
                      {erro && <p className="text-sm text-red-600">{erro}</p>}
                      <Button className="w-full" disabled={enviando || !endereco.trim()} onClick={finalizar}>
                        {enviando ? "Enviando…" : "Fazer pedido"}
                      </Button>
                      {grupos.length > 1 && (
                        <p className="text-xs text-slate-500">
                          Itens de vendedores diferentes viram pedidos separados.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        {modo === "cliente"
                          ? "Entre como cliente para finalizar a compra."
                          : "Entre com a conta da sua assistência para comprar."}
                      </p>
                      <Link href="/login">
                        <Button className="w-full">Entrar</Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* no celular o carrinho fica no fim da lista — atalho flutuante até ele */}
      {carrinho.itens.length > 0 && (
        <a
          href="#carrinho"
          className={`fixed inset-x-4 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] z-30 flex items-center justify-between rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg md:bottom-4 ${modo === "cliente" ? "lg:hidden" : "xl:hidden"}`}
        >
          <span>Ver carrinho ({carrinho.quantidadeTotal})</span>
          <span>{formatBRL(carrinho.total)}</span>
        </a>
      )}
    </div>
  );
}
