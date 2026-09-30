"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { geocodificar } from "@/lib/geo";
import { resolverPreco } from "@/lib/precos";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MARCAS, TIPOS_REPARO, formatBRL, type Preco } from "@/lib/types";
import { FAMILIAS_AGENDAMENTO } from "@/lib/catalogo-iphone";
import { cn } from "@/lib/utils";

// ---------- escolha de data e horário ----------
const HORARIOS = [
  { periodo: "Manhã", horas: ["08:00", "09:00", "10:00", "11:00"] },
  { periodo: "Tarde", horas: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"] },
  { periodo: "Noite", horas: ["18:00", "19:00", "20:00"] },
];

function chaveDia(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function proximosDias(qtd: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    return d;
  });
}

function nomeDiaSemana(d: Date, i: number) {
  if (i === 0) return "Hoje";
  if (i === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function SeletorHorario({
  dia,
  hora,
  onDia,
  onHora,
}: {
  dia: string;
  hora: string;
  onDia: (v: string) => void;
  onHora: (v: string) => void;
}) {
  const [dias] = useState(() => proximosDias(14));
  const [agora] = useState(() => Date.now());
  const hojeChave = chaveDia(dias[0]);

  function horaPassou(h: string) {
    if (dia !== hojeChave) return false;
    const [hh, mm] = h.split(":").map(Number);
    const limite = new Date();
    limite.setHours(hh, mm, 0, 0);
    return limite.getTime() <= agora + 30 * 60 * 1000; // precisa de 30 min de antecedência
  }

  const escolhido = dia ? dias.find((d) => chaveDia(d) === dia) : null;

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {dias.map((d, i) => {
          const chave = chaveDia(d);
          const ativo = chave === dia;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => {
                onDia(ativo ? "" : chave);
                if (ativo) onHora("");
              }}
              className={cn(
                "flex w-[4.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition",
                ativo
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className={cn("text-[11px] font-medium uppercase tracking-wide", ativo ? "text-blue-100" : "text-slate-400")}>
                {nomeDiaSemana(d, i)}
              </span>
              <span className="text-xl font-semibold leading-tight">{d.getDate()}</span>
              <span className={cn("text-[11px]", ativo ? "text-blue-100" : "text-slate-400")}>
                {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
              </span>
            </button>
          );
        })}
      </div>

      {dia && (
        <div className="space-y-3">
          {HORARIOS.map((grupo) => (
            <div key={grupo.periodo}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{grupo.periodo}</p>
              <div className="flex flex-wrap gap-2">
                {grupo.horas.map((h) => {
                  const passou = horaPassou(h);
                  const ativo = h === hora;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={passou}
                      onClick={() => onHora(ativo ? "" : h)}
                      className={cn(
                        "rounded-lg border px-3.5 py-2 text-sm font-medium tabular-nums transition",
                        ativo
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                        passou && "cursor-not-allowed opacity-35 line-through hover:bg-white"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {escolhido && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {hora ? (
            <>
              Atendimento preferido:{" "}
              <span className="font-medium text-slate-900">
                {escolhido.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {hora}
              </span>
            </>
          ) : (
            "Agora escolha um horário."
          )}{" "}
          <button
            type="button"
            className="ml-1 text-blue-600 hover:underline"
            onClick={() => {
              onDia("");
              onHora("");
            }}
          >
            Limpar
          </button>
        </p>
      )}
    </div>
  );
}

// ---------- escolha do modelo de iPhone ----------
function SeletorModeloIphone({ modelo, onModelo }: { modelo: string; onModelo: (v: string) => void }) {
  const familiaDoModelo = FAMILIAS_AGENDAMENTO.find((f) => f.modelos.includes(modelo))?.titulo ?? null;
  const [familiaEscolhida, setFamiliaEscolhida] = useState<string | null>(null);
  const familia = familiaEscolhida ?? familiaDoModelo;
  const modelos = FAMILIAS_AGENDAMENTO.find((f) => f.titulo === familia)?.modelos ?? [];

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FAMILIAS_AGENDAMENTO.map((f) => (
          <button
            key={f.titulo}
            type="button"
            onClick={() => setFamiliaEscolhida(f.titulo)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              familia === f.titulo
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {f.titulo}
          </button>
        ))}
      </div>

      {familia ? (
        <div className="grid grid-cols-2 gap-2">
          {modelos.map((m) => {
            const ativo = m === modelo;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onModelo(m)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-medium transition",
                  ativo
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
          Escolha a linha do seu iPhone acima para ver os modelos.
        </p>
      )}

      {modelo && (
        <p className="text-sm text-slate-600">
          Modelo escolhido: <span className="font-medium text-slate-900">{modelo}</span>
        </p>
      )}
    </div>
  );
}

export default function AgendarPage() {
  const { user, cliente, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [precos, setPrecos] = useState<Preco[]>([]);
  const [marca, setMarca] = useState(MARCAS[0]);
  const [modelo, setModelo] = useState("");
  const [tipoReparo, setTipoReparo] = useState(TIPOS_REPARO[0]);
  const [endereco, setEndereco] = useState("");
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("marketplace_precos")
      .select("*")
      .eq("ativo", true)
      .then(({ data }) => setPrecos((data as Preco[]) ?? []));
  }, [supabase]);

  const modelosSugeridos = useMemo(() => {
    const set = new Set<string>();
    precos.forEach((p) => {
      if (p.modelo !== "*" && (p.marca === "*" || p.marca === marca)) set.add(p.modelo);
    });
    return Array.from(set).sort();
  }, [precos, marca]);

  const precoEstimado = resolverPreco(precos, marca, modelo, tipoReparo);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;
    setError(null);
    if (!modelo.trim()) {
      setError("Escolha o modelo do seu aparelho.");
      return;
    }
    if (dia && !hora) {
      setError("Escolha também o horário, ou limpe a data para deixar em aberto.");
      return;
    }
    setSubmitting(true);

    // localização aproximada para achar assistências por perto (se não achar, segue sem)
    const coords = await geocodificar(endereco);

    const { data, error: insertError } = await supabase
      .from("marketplace_trabalhos")
      .insert({
        cliente_id: cliente.id,
        marca,
        modelo,
        tipo_reparo: tipoReparo,
        preco_estimado: precoEstimado,
        endereco,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        horario_preferido: dia && hora ? new Date(`${dia}T${hora}:00`).toISOString() : null,
      })
      .select()
      .single();

    setSubmitting(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "Não foi possível agendar. Tente de novo.");
      return;
    }
    router.push("/meus-reparos");
  }

  if (loading) return null;

  if (!user || !cliente) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Entre para agendar seu reparo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Crie uma conta de cliente para agendar e acompanhar seus reparos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
          <Link href="/cadastro">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Agendar reparo</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Seu pedido entra na fila aberta — a primeira assistência parceira
            disponível na sua região aceita e assume o serviço.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Select
                  id="marca"
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    setModelo("");
                  }}
                >
                  {MARCAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {marca === "Apple" ? (
              <div>
                <Label>Qual é o seu iPhone?</Label>
                <SeletorModeloIphone modelo={modelo} onModelo={setModelo} />
              </div>
            ) : (
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  required
                  list="modelos-sugeridos"
                  placeholder="Ex.: Galaxy S23"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
                <datalist id="modelos-sugeridos">
                  {modelosSugeridos.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            )}

            <div>
              <Label htmlFor="tipo">Tipo de reparo</Label>
              <Select
                id="tipo"
                value={tipoReparo}
                onChange={(e) => setTipoReparo(e.target.value)}
              >
                {TIPOS_REPARO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              {precoEstimado !== null && (
                <p className="mt-1.5 text-sm text-slate-500">
                  Preço estimado:{" "}
                  <span className="font-medium text-slate-900">{formatBRL(precoEstimado)}</span>{" "}
                  (o valor final é informado pela assistência e você confirma no app)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endereco">Endereço para o atendimento</Label>
              <Textarea
                id="endereco"
                required
                rows={2}
                placeholder="Rua, número, bairro, cidade"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>

            <div>
              <Label>Quando você prefere ser atendido? (opcional)</Label>
              <SeletorHorario dia={dia} hora={hora} onDia={setDia} onHora={setHora} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Enviando..." : "Buscar assistência disponível"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
