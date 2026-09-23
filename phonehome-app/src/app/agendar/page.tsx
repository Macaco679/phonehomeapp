"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MARCAS, TIPOS_REPARO, PRECO_BASE, formatBRL } from "@/lib/types";

export default function AgendarPage() {
  const { user, cliente, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [marca, setMarca] = useState(MARCAS[0]);
  const [modelo, setModelo] = useState("");
  const [tipoReparo, setTipoReparo] = useState(TIPOS_REPARO[0]);
  const [endereco, setEndereco] = useState("");
  const [horario, setHorario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const precoEstimado = PRECO_BASE[tipoReparo] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;
    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("marketplace_trabalhos")
      .insert({
        cliente_id: cliente.id,
        marca,
        modelo,
        tipo_reparo: tipoReparo,
        preco_estimado: precoEstimado,
        endereco,
        horario_preferido: horario ? new Date(horario).toISOString() : null,
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Select id="marca" value={marca} onChange={(e) => setMarca(e.target.value)}>
                  {MARCAS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  required
                  placeholder="iPhone 13"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
            </div>

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
              {precoEstimado && (
                <p className="mt-1.5 text-sm text-slate-500">
                  Preço estimado: <span className="font-medium text-slate-900">{formatBRL(precoEstimado)}</span>{" "}
                  (confirmado pela assistência que aceitar)
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
              <Label htmlFor="horario">Horário preferido (opcional)</Label>
              <Input
                id="horario"
                type="datetime-local"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
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
