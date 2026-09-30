"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { geocodificar } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { Assistencia } from "@/lib/types";

export default function ConfiguracoesPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [a, setA] = useState<Assistencia | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [raio, setRaio] = useState("10");
  const [especialidades, setEspecialidades] = useState("");
  const [status, setStatus] = useState<"ativa" | "pausada">("ativa");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ehDono = assistenciaUsuario?.papel === "dono";

  useEffect(() => {
    if (!assistenciaUsuario) return;
    supabase
      .from("marketplace_assistencias")
      .select("*")
      .eq("id", assistenciaUsuario.assistencia_id)
      .single()
      .then(({ data }) => {
        const x = data as Assistencia | null;
        if (!x) return;
        setA(x);
        setNome(x.nome);
        setEndereco(x.endereco ?? "");
        setRaio(String(x.raio_atendimento_km ?? 10));
        setEspecialidades((x.especialidades ?? []).join(", "));
        setStatus(x.status);
      });
  }, [assistenciaUsuario, supabase]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!a) return;
    setBusy(true);
    setErro(null);
    setMsg(null);
    const campos: Record<string, unknown> = {
      nome: nome.trim(),
      endereco: endereco.trim() || null,
      raio_atendimento_km: Number(raio) || 10,
      especialidades: especialidades
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status,
    };
    let aviso = "";
    if (endereco.trim() && endereco.trim() !== (a.endereco ?? "")) {
      const geo = await geocodificar(endereco);
      if (geo) {
        campos.latitude = geo.latitude;
        campos.longitude = geo.longitude;
      } else {
        aviso = " Não consegui localizar o endereço no mapa — inclua rua, número, cidade e estado para receber a fila da sua região.";
      }
    }
    const { error } = await supabase.from("marketplace_assistencias").update(campos).eq("id", a.id);
    if (error) setErro(error.message);
    else setMsg("Dados salvos." + aviso);
    setBusy(false);
  }

  if (!assistenciaUsuario) return null;
  if (!a) return <p className="text-sm text-slate-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Minha assistência</h1>
      {!ehDono && (
        <p className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          Só o dono da assistência pode alterar estes dados.
        </p>
      )}
      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {msg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Dados e área de atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome da assistência</Label>
              <Input id="nome" required disabled={!ehDono} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="end">Endereço (usado para calcular a distância dos trabalhos)</Label>
              <Input
                id="end"
                disabled={!ehDono}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
              />
              {a.latitude === null && (
                <p className="mt-1 text-xs text-amber-700">
                  Sem localização no mapa ainda — você verá todos os trabalhos da fila até salvar um endereço válido.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="raio">Raio de atendimento (km)</Label>
              <Input id="raio" type="number" min={1} disabled={!ehDono} value={raio} onChange={(e) => setRaio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="status">Situação</Label>
              <Select id="status" disabled={!ehDono} value={status} onChange={(e) => setStatus(e.target.value as "ativa" | "pausada")}>
                <option value="ativa">Ativa (recebendo trabalhos)</option>
                <option value="pausada">Pausada (não aceitar novos)</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="esp">Especialidades (separe por vírgula)</Label>
              <Input
                id="esp"
                disabled={!ehDono}
                value={especialidades}
                onChange={(e) => setEspecialidades(e.target.value)}
                placeholder="iPhone, Samsung, Display, Bateria"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Comissão da plataforma para a sua assistência: {a.taxa_comissao_pct}% por serviço concluído.
              </p>
              {ehDono && (
                <Button type="submit" disabled={busy}>
                  Salvar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
