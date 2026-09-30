"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Label } from "@/components/ui/input";
import { formatBRL, type Trabalho, type UsuarioAssistencia } from "@/lib/types";

const PERIODOS = [
  { v: "7", l: "Últimos 7 dias" },
  { v: "30", l: "Últimos 30 dias" },
  { v: "90", l: "Últimos 90 dias" },
  { v: "365", l: "Último ano" },
];

function contar<T>(lista: T[], chave: (x: T) => string) {
  const m: Record<string, number> = {};
  lista.forEach((x) => {
    const k = chave(x);
    m[k] = (m[k] ?? 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

export default function RelatoriosPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [periodo, setPeriodo] = useState("30");
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [equipe, setEquipe] = useState<UsuarioAssistencia[]>([]);

  useEffect(() => {
    if (!assistenciaUsuario) return;
    const desde = new Date(Date.now() - Number(periodo) * 86400000).toISOString();
    Promise.all([
      supabase
        .from("marketplace_trabalhos")
        .select("*")
        .eq("assistencia_id", assistenciaUsuario.assistencia_id)
        .gte("created_at", desde),
      supabase.from("marketplace_usuarios").select("*").eq("assistencia_id", assistenciaUsuario.assistencia_id),
    ]).then(([{ data: t }, { data: e }]) => {
      setTrabalhos((t as Trabalho[]) ?? []);
      setEquipe((e as UsuarioAssistencia[]) ?? []);
    });
  }, [assistenciaUsuario, periodo, supabase]);

  const m = useMemo(() => {
    const concluidos = trabalhos.filter((t) => t.status === "concluido");
    const faturamento = concluidos.reduce((s, t) => s + Number(t.valor_final ?? 0), 0);
    const comissao = concluidos.reduce((s, t) => s + Number(t.comissao_valor ?? 0), 0);
    const ticket = concluidos.length ? faturamento / concluidos.length : 0;
    const emAndamento = trabalhos.filter((t) => ["aceito", "a_caminho", "em_reparo"].includes(t.status)).length;
    const cancelados = trabalhos.filter((t) => t.status === "cancelado").length;
    const tempos = concluidos
      .filter((t) => t.aceito_em && t.concluido_em)
      .map((t) => (new Date(t.concluido_em!).getTime() - new Date(t.aceito_em!).getTime()) / 3600000);
    const tempoMedio = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : null;
    const porTecnico = equipe.map((u) => {
      const feitos = concluidos.filter((t) => t.tecnico_id === u.id);
      return {
        nome: u.nome ?? "Sem nome",
        qtd: feitos.length,
        valor: feitos.reduce((s, t) => s + Number(t.valor_final ?? 0), 0),
      };
    });
    const semTecnico = concluidos.filter((t) => !t.tecnico_id);
    if (semTecnico.length) {
      porTecnico.push({
        nome: "Sem técnico definido",
        qtd: semTecnico.length,
        valor: semTecnico.reduce((s, t) => s + Number(t.valor_final ?? 0), 0),
      });
    }
    return {
      concluidos,
      faturamento,
      comissao,
      liquido: faturamento - comissao,
      ticket,
      emAndamento,
      cancelados,
      tempoMedio,
      porReparo: contar(concluidos, (t) => t.tipo_reparo),
      porModelo: contar(concluidos, (t) => `${t.marca} ${t.modelo}`),
      porTecnico: porTecnico.sort((a, b) => b.qtd - a.qtd),
    };
  }, [trabalhos, equipe]);

  if (!assistenciaUsuario) return null;

  const kpis = [
    { l: "Serviços concluídos", v: String(m.concluidos.length) },
    { l: "Faturamento", v: formatBRL(m.faturamento) },
    { l: "Comissão da plataforma", v: formatBRL(m.comissao) },
    { l: "Líquido para a assistência", v: formatBRL(m.liquido) },
    { l: "Ticket médio", v: formatBRL(m.ticket) },
    { l: "Em andamento", v: String(m.emAndamento) },
    { l: "Cancelados", v: String(m.cancelados) },
    { l: "Tempo médio do serviço", v: m.tempoMedio === null ? "—" : `${m.tempoMedio.toFixed(1)} h` },
  ];

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios</h1>
        <div className="w-48">
          <Label htmlFor="periodo">Período</Label>
          <Select id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p.v} value={p.v}>
                {p.l}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.l}>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-slate-500">{k.l}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por técnico</CardTitle>
          </CardHeader>
          <CardContent>
            {m.porTecnico.length === 0 && <p className="text-sm text-slate-500">Sem dados no período.</p>}
            <ul className="space-y-2 text-sm">
              {m.porTecnico.map((t) => (
                <li key={t.nome} className="flex justify-between">
                  <span className="text-slate-700">{t.nome}</span>
                  <span className="text-slate-900">
                    {t.qtd} serviço(s) · {formatBRL(t.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reparos mais feitos</CardTitle>
          </CardHeader>
          <CardContent>
            {m.porReparo.length === 0 && <p className="text-sm text-slate-500">Sem dados no período.</p>}
            <ul className="space-y-2 text-sm">
              {m.porReparo.map(([nome, qtd]) => (
                <li key={nome} className="flex justify-between">
                  <span className="text-slate-700">{nome}</span>
                  <span className="text-slate-900">{qtd}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Modelos mais atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {m.porModelo.length === 0 && <p className="text-sm text-slate-500">Sem dados no período.</p>}
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {m.porModelo.slice(0, 10).map(([nome, qtd]) => (
                <li key={nome} className="flex justify-between">
                  <span className="text-slate-700">{nome}</span>
                  <span className="text-slate-900">{qtd}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
