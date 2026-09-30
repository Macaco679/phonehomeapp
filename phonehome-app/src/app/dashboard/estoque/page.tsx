"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { formatBRL, type EstoqueItem } from "@/lib/types";
import {
  SERIES,
  ordemDaPeca,
  ordemDoModelo,
  serieDoModelo,
  type Serie,
} from "@/lib/catalogo-iphone";
import { cn } from "@/lib/utils";

type Situacao = "falta" | "baixo" | "ok";
type FiltroSituacao = "todos" | Situacao;

function situacao(item: EstoqueItem): Situacao {
  if (item.quantidade <= 0) return "falta";
  if (item.quantidade <= item.quantidade_minima) return "baixo";
  return "ok";
}

const SITUACAO_UI: Record<Situacao, { label: string; pill: string; dot: string }> = {
  falta: { label: "Em falta", pill: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  baixo: { label: "Estoque baixo", pill: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  ok: { label: "Em estoque", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};

// ---------- ícones (traços simples, sem dependências) ----------
function Icone({ peca, className }: { peca: string; className?: string }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let corpo: React.ReactNode;
  switch (peca) {
    case "Tela":
      corpo = (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" {...p} />
          <path d="M10.5 5h3" {...p} />
        </>
      );
      break;
    case "Bateria":
      corpo = (
        <>
          <rect x="3" y="7.5" width="16" height="9" rx="2" {...p} />
          <path d="M21 10.5v3" {...p} />
          <path d="M9.5 10.5l-1.5 3h3l-1.5 3" {...p} />
        </>
      );
      break;
    case "Conector de carga":
      corpo = (
        <>
          <path d="M9 3v4M15 3v4" {...p} />
          <path d="M7 7h10v4a5 5 0 0 1-10 0V7z" {...p} />
          <path d="M12 16v5" {...p} />
        </>
      );
      break;
    case "Câmera traseira":
    case "Câmera frontal":
      corpo = (
        <>
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" {...p} />
          <circle cx="12" cy="13" r="3.2" {...p} />
        </>
      );
      break;
    case "Alto-falante auricular":
      corpo = (
        <>
          <rect x="3.5" y="9.5" width="17" height="5" rx="2.5" {...p} />
          <path d="M8 12h8" {...p} />
        </>
      );
      break;
    case "Alto-falante inferior":
      corpo = (
        <>
          <path d="M4 10v4h3.5L12 18V6L7.5 10H4z" {...p} />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...p} />
        </>
      );
      break;
    case "Taptic Engine":
      corpo = (
        <>
          <rect x="8" y="5" width="8" height="14" rx="2" {...p} />
          <path d="M4.5 9v6M19.5 9v6M2 11v2M22 11v2" {...p} />
        </>
      );
      break;
    case "Vidro traseiro":
      corpo = (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" {...p} />
          <circle cx="10.5" cy="7" r="1.6" {...p} />
          <path d="M9 17.5l6-6" {...p} />
        </>
      );
      break;
    case "Flex Face ID":
      corpo = (
        <>
          <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...p} />
          <path d="M9.5 10v1.5M14.5 10v1.5M12 10.5v3h-1M9.5 15.5a3.5 3.5 0 0 0 5 0" {...p} />
        </>
      );
      break;
    default:
      corpo = (
        <>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...p} />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" {...p} />
        </>
      );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {corpo}
    </svg>
  );
}

function IconeKpi({ tipo }: { tipo: "total" | "falta" | "baixo" | "valor" }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      {tipo === "total" && (
        <>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...p} />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" {...p} />
        </>
      )}
      {tipo === "falta" && (
        <>
          <circle cx="12" cy="12" r="9" {...p} />
          <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" {...p} />
        </>
      )}
      {tipo === "baixo" && (
        <>
          <path d="M12 4l9 16H3L12 4z" {...p} />
          <path d="M12 10v4M12 17v.01" {...p} />
        </>
      )}
      {tipo === "valor" && (
        <>
          <circle cx="12" cy="12" r="9" {...p} />
          <path d="M14.5 9.2c-.6-.8-1.5-1.2-2.6-1.2-1.4 0-2.4.7-2.4 1.8 0 2.6 5.2 1.3 5.2 4 0 1.1-1.1 1.9-2.7 1.9-1.2 0-2.2-.5-2.8-1.4M12 6.5V8M12 16v1.5" {...p} />
        </>
      )}
    </svg>
  );
}

// ---------- campo numérico que salva ao sair do campo ----------
function CampoNumero({
  valor,
  prefixo,
  casas = 0,
  placeholder,
  onSalvar,
  className,
  ariaLabel,
}: {
  valor: number | null;
  prefixo?: string;
  casas?: number;
  placeholder?: string;
  onSalvar: (novo: number | null) => void;
  className?: string;
  ariaLabel: string;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const mostrado = texto ?? (valor === null ? "" : casas ? valor.toFixed(casas) : String(valor));

  function confirmar() {
    if (texto === null) return;
    const limpo = texto.replace(",", ".").trim();
    setTexto(null);
    if (limpo === "") {
      if (valor !== null) onSalvar(null);
      return;
    }
    const n = Number(limpo);
    if (Number.isNaN(n) || n < 0) return;
    const arred = casas ? Math.round(n * 10 ** casas) / 10 ** casas : Math.round(n);
    if (arred !== valor) onSalvar(arred);
  }

  return (
    <div className={cn("relative", className)}>
      {prefixo && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {prefixo}
        </span>
      )}
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        placeholder={placeholder}
        value={mostrado}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setTexto(null);
        }}
        className={cn(
          "h-9 w-full rounded-lg border border-transparent bg-slate-50 px-2.5 text-sm text-slate-900 tabular-nums placeholder:text-slate-300 transition",
          "hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100",
          prefixo && "pl-8"
        )}
      />
    </div>
  );
}

// ---------- linha de peça ----------
function LinhaPeca({
  item,
  onAtualizar,
}: {
  item: EstoqueItem;
  onAtualizar: (id: string, campos: Partial<EstoqueItem>) => void;
}) {
  const sit = situacao(item);
  const ui = SITUACAO_UI[sit];
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1.6fr)_7rem_7rem_auto_8.5rem]",
        "border-t border-slate-100 first:border-t-0 transition-colors hover:bg-slate-50/60"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            sit === "falta" ? "bg-red-50 text-red-600" : sit === "baixo" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
          )}
        >
          <Icone peca={item.peca} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{item.peca}</p>
          <p className="truncate text-xs text-slate-400 sm:hidden">
            {item.preco_venda !== null ? formatBRL(item.preco_venda) : "Sem preço de venda"}
          </p>
        </div>
      </div>

      <div className="order-last col-span-2 grid grid-cols-2 gap-2 sm:order-none sm:col-span-2 sm:contents">
        <CampoNumero
          ariaLabel={`Custo de ${item.peca}`}
          valor={item.preco_custo}
          prefixo="R$"
          casas={2}
          placeholder="Custo"
          onSalvar={(v) => onAtualizar(item.id, { preco_custo: v })}
        />
        <CampoNumero
          ariaLabel={`Preço de venda de ${item.peca}`}
          valor={item.preco_venda}
          prefixo="R$"
          casas={2}
          placeholder="Venda"
          onSalvar={(v) => onAtualizar(item.id, { preco_venda: v })}
        />
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          aria-label={`Diminuir ${item.peca}`}
          disabled={item.quantidade <= 0}
          onClick={() => onAtualizar(item.id, { quantidade: item.quantidade - 1 })}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <CampoNumero
          ariaLabel={`Quantidade de ${item.peca}`}
          valor={item.quantidade}
          onSalvar={(v) => onAtualizar(item.id, { quantidade: v ?? 0 })}
          className="w-14 [&_input]:text-center [&_input]:font-semibold"
        />
        <button
          type="button"
          aria-label={`Aumentar ${item.peca}`}
          onClick={() => onAtualizar(item.id, { quantidade: item.quantidade + 1 })}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none text-slate-600 transition hover:bg-slate-50 active:scale-95"
        >
          +
        </button>
      </div>

      <div className="hidden justify-end sm:flex">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
            ui.pill
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", ui.dot)} />
          {ui.label}
        </span>
      </div>
    </div>
  );
}

// ---------- página ----------
export default function EstoquePage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = createClient();
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [serie, setSerie] = useState<Serie | "todas">("todas");
  const [filtro, setFiltro] = useState<FiltroSituacao>("todos");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Nova peça (fora do catálogo)
  const [formAberto, setFormAberto] = useState(false);
  const [peca, setPeca] = useState("");
  const [modelo, setModelo] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [minima, setMinima] = useState("2");
  const [precoVenda, setPrecoVenda] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const { data, error } = await supabase
      .from("marketplace_estoque")
      .select("*")
      .eq("assistencia_id", assistenciaUsuario.assistencia_id)
      .limit(2000);
    if (error) setErro(error.message);
    setItens((data as EstoqueItem[]) ?? []);
    setCarregando(false);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Atualização otimista: a tela muda na hora e o banco confirma em seguida.
  async function atualizar(id: string, campos: Partial<EstoqueItem>) {
    const anterior = itens.find((i) => i.id === id);
    if (!anterior) return;
    const agora = new Date().toISOString();
    setItens((lista) => lista.map((i) => (i.id === id ? { ...i, ...campos, updated_at: agora } : i)));
    const { error } = await supabase
      .from("marketplace_estoque")
      .update({ ...campos, updated_at: agora })
      .eq("id", id);
    if (error) {
      setItens((lista) => lista.map((i) => (i.id === id ? anterior : i)));
      setErro(error.message);
    }
  }

  async function carregarCatalogo() {
    setCarregandoCatalogo(true);
    setErro(null);
    setAviso(null);
    const { data, error } = await supabase.rpc("marketplace_carregar_catalogo_iphone");
    if (error) setErro(error.message);
    else setAviso(Number(data) > 0 ? `${data} peças adicionadas ao seu estoque.` : "Seu catálogo já está completo.");
    await load();
    setCarregandoCatalogo(false);
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!assistenciaUsuario || !peca.trim()) return;
    setBusy(true);
    setErro(null);
    const { error } = await supabase.from("marketplace_estoque").insert({
      assistencia_id: assistenciaUsuario.assistencia_id,
      peca: peca.trim(),
      modelo_compativel: modelo.trim() || null,
      quantidade: Number(quantidade) || 0,
      quantidade_minima: Number(minima) || 2,
      preco_venda: precoVenda ? Number(precoVenda) : null,
    });
    if (error) setErro(error.message);
    else {
      setPeca("");
      setModelo("");
      setQuantidade("0");
      setPrecoVenda("");
      setFormAberto(false);
    }
    setBusy(false);
    await load();
  }

  const kpis = useMemo(() => {
    let falta = 0;
    let baixo = 0;
    let valor = 0;
    for (const i of itens) {
      const s = situacao(i);
      if (s === "falta") falta++;
      if (s === "baixo") baixo++;
      valor += i.quantidade * Number(i.preco_custo ?? i.preco_venda ?? 0);
    }
    return { total: itens.length, falta, baixo, valor };
  }, [itens]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = itens.filter((i) => {
      if (serie !== "todas" && serieDoModelo(i.modelo_compativel) !== serie) return false;
      if (filtro !== "todos" && situacao(i) !== filtro) return false;
      if (termo) {
        const texto = `${i.peca} ${i.modelo_compativel ?? ""}`.toLowerCase();
        if (!termo.split(/\s+/).every((t) => texto.includes(t))) return false;
      }
      return true;
    });
    const mapa = new Map<string, EstoqueItem[]>();
    for (const i of filtrados) {
      const chave = i.modelo_compativel ?? "Outras peças";
      mapa.set(chave, [...(mapa.get(chave) ?? []), i]);
    }
    return [...mapa.entries()]
      .sort((a, b) => ordemDoModelo(a[0] === "Outras peças" ? null : a[0]) - ordemDoModelo(b[0] === "Outras peças" ? null : b[0]) || a[0].localeCompare(b[0]))
      .map(([nome, lista]) => ({
        nome,
        itens: lista.sort((x, y) => ordemDaPeca(x.peca) - ordemDaPeca(y.peca) || x.peca.localeCompare(y.peca)),
      }));
  }, [itens, busca, serie, filtro]);

  const buscando = busca.trim() !== "" || filtro !== "todos" || serie !== "todas";

  function grupoAberto(nome: string) {
    if (nome in abertos) return abertos[nome];
    return buscando; // com filtros ativos, já abre os modelos encontrados
  }

  function alternarTodos(abrir: boolean) {
    const novo: Record<string, boolean> = {};
    for (const g of grupos) novo[g.nome] = abrir;
    setAbertos((a) => ({ ...a, ...novo }));
  }

  if (!assistenciaUsuario) return null;

  const cardsKpi = [
    { tipo: "total" as const, rotulo: "Peças no catálogo", valor: String(kpis.total), tom: "bg-blue-50 text-blue-600", acao: null },
    { tipo: "falta" as const, rotulo: "Em falta", valor: String(kpis.falta), tom: "bg-red-50 text-red-600", acao: "falta" as const },
    { tipo: "baixo" as const, rotulo: "Estoque baixo", valor: String(kpis.baixo), tom: "bg-amber-50 text-amber-600", acao: "baixo" as const },
    { tipo: "valor" as const, rotulo: "Valor em estoque", valor: formatBRL(kpis.valor), tom: "bg-emerald-50 text-emerald-600", acao: null },
  ];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Estoque</h1>
          <p className="mt-1 text-sm text-slate-500">
            Peças de iPhone 11 ao iPhone 17. Ajuste as quantidades e os preços direto na lista.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarCatalogo} disabled={carregandoCatalogo}>
            {carregandoCatalogo ? "Carregando..." : "Atualizar catálogo"}
          </Button>
          <Button onClick={() => setFormAberto((v) => !v)}>{formAberto ? "Fechar" : "+ Nova peça"}</Button>
        </div>
      </div>

      {(erro || aviso) && (
        <div
          className={cn(
            "mb-4 rounded-lg border px-4 py-2.5 text-sm",
            erro ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {erro ?? aviso}
        </div>
      )}

      {/* Indicadores */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cardsKpi.map((k) => {
          const clicavel = k.acao !== null;
          const ativo = clicavel && filtro === k.acao;
          return (
            <button
              key={k.tipo}
              type="button"
              disabled={!clicavel}
              onClick={() => k.acao && setFiltro(ativo ? "todos" : k.acao)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-sm transition",
                clicavel ? "cursor-pointer hover:border-slate-300 hover:shadow" : "cursor-default",
                ativo ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
              )}
            >
              <span className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", k.tom)}>
                <IconeKpi tipo={k.tipo} />
              </span>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{k.valor}</p>
              <p className="mt-0.5 text-xs text-slate-500">{k.rotulo}</p>
            </button>
          );
        })}
      </div>

      {/* Nova peça */}
      {formAberto && (
        <Card className="mb-6 border-blue-100">
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-slate-900">Adicionar peça fora do catálogo</p>
            <form onSubmit={adicionar} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              <div className="col-span-2">
                <Label htmlFor="peca">Peça</Label>
                <Input id="peca" required value={peca} onChange={(e) => setPeca(e.target.value)} placeholder="Ex.: Película 3D" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="modelo-compat">Modelo compatível</Label>
                <Input id="modelo-compat" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex.: iPhone 13 Pro" />
              </div>
              <div>
                <Label htmlFor="qtd">Quantidade</Label>
                <Input id="qtd" type="number" min={0} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="qtd-min">Mínimo</Label>
                <Input id="qtd-min" type="number" min={0} value={minima} onChange={(e) => setMinima(e.target.value)} />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <Label htmlFor="preco-venda">Preço de venda (opcional)</Label>
                <Input id="preco-venda" type="number" min={0} step="0.01" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} />
              </div>
              <div className="col-span-2 flex items-end">
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Salvando..." : "Adicionar ao estoque"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Busca e filtros */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar peça ou modelo — ex.: bateria 13 pro"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(["todas", ...SERIES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSerie(s)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  serie === s
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                )}
              >
                {s === "todas" ? "Todos" : `iPhone ${s}`}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ["todos", "Tudo"],
                ["falta", "Em falta"],
                ["baixo", "Baixo"],
                ["ok", "Em estoque"],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition",
                  filtro === valor ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grupos.length > 0 && (
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>
            {grupos.length} {grupos.length === 1 ? "modelo" : "modelos"} ·{" "}
            {grupos.reduce((s, g) => s + g.itens.length, 0)} peças
          </span>
          <span className="flex gap-3">
            <button type="button" className="hover:text-slate-900" onClick={() => alternarTodos(true)}>
              Abrir todos
            </button>
            <button type="button" className="hover:text-slate-900" onClick={() => alternarTodos(false)}>
              Recolher todos
            </button>
          </span>
        </div>
      )}

      {/* Lista agrupada por modelo */}
      <div className="space-y-3">
        {carregando && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">Carregando estoque...</CardContent>
          </Card>
        )}

        {grupos.map((g) => {
          const aberto = grupoAberto(g.nome);
          const falta = g.itens.filter((i) => situacao(i) === "falta").length;
          const baixo = g.itens.filter((i) => situacao(i) === "baixo").length;
          const unidades = g.itens.reduce((s, i) => s + i.quantidade, 0);
          return (
            <div key={g.nome} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setAbertos((a) => ({ ...a, [g.nome]: !aberto }))}
                aria-expanded={aberto}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white">
                  <Icone peca="Tela" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-slate-900">{g.nome}</span>
                  <span className="block text-xs text-slate-500">
                    {g.itens.length} peças · {unidades} {unidades === 1 ? "unidade" : "unidades"} em estoque
                  </span>
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  {falta > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                      {falta} em falta
                    </span>
                  )}
                  {baixo > 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      {baixo} baixo
                    </span>
                  )}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", aberto && "rotate-180")}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {aberto && (
                <div className="border-t border-slate-200">
                  <div className="hidden grid-cols-[minmax(0,1.6fr)_7rem_7rem_auto_8.5rem] gap-x-4 bg-slate-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
                    <span>Peça</span>
                    <span>Custo</span>
                    <span>Venda</span>
                    <span className="w-[8.75rem] text-center">Quantidade</span>
                    <span className="text-right">Situação</span>
                  </div>
                  {g.itens.map((item) => (
                    <LinhaPeca key={item.id} item={item} onAtualizar={atualizar} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!carregando && itens.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="text-base font-medium text-slate-900">Seu estoque ainda está vazio</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Carregue o catálogo completo de peças de iPhone 11 ao 17 e depois é só informar as quantidades.
              </p>
              <Button className="mt-5" onClick={carregarCatalogo} disabled={carregandoCatalogo}>
                {carregandoCatalogo ? "Carregando..." : "Carregar catálogo de iPhone"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!carregando && itens.length > 0 && grupos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              Nenhuma peça encontrada com esses filtros.{" "}
              <button
                type="button"
                className="font-medium text-blue-600 hover:underline"
                onClick={() => {
                  setBusca("");
                  setSerie("todas");
                  setFiltro("todos");
                }}
              >
                Limpar filtros
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
