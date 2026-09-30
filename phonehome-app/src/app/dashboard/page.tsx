"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { distanciaKm } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, type Assistencia, type Trabalho } from "@/lib/types";

export default function FilaDeTrabalhosPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [fila, setFila] = useState<Trabalho[]>([]);
  const [assistencia, setAssistencia] = useState<Assistencia | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const [{ data }, { data: ass }] = await Promise.all([
      supabase
        .from("marketplace_trabalhos")
        .select("*")
        .eq("status", "fila")
        .order("created_at", { ascending: true }),
      supabase.from("marketplace_assistencias").select("*").eq("id", assistenciaUsuario.assistencia_id).maybeSingle(),
    ]);
    setFila((data as Trabalho[]) ?? []);
    setAssistencia(ass as Assistencia | null);
  }, [supabase, assistenciaUsuario]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("fila-de-trabalhos")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_trabalhos" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  async function aceitar(id: string) {
    setBusyId(id);
    setError(null);
    const { error } = await supabase.from("marketplace_trabalhos").update({ status: "aceito" }).eq("id", id);
    setBusyId(null);
    if (error) {
      setError(
        error.message.includes("nao esta mais na fila")
          ? "Outra assistência já aceitou esse trabalho."
          : error.message
      );
    }
    await load();
  }

  function distancia(t: Trabalho): number | null {
    if (!assistencia?.latitude || !assistencia.longitude || t.latitude === null || t.longitude === null) return null;
    return distanciaKm(
      { latitude: Number(assistencia.latitude), longitude: Number(assistencia.longitude) },
      { latitude: Number(t.latitude), longitude: Number(t.longitude) }
    );
  }

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Fila de trabalhos disponíveis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Primeiro que aceitar, leva. Você vê os trabalhos dentro do seu raio de atendimento
          {assistencia ? ` (${assistencia.raio_atendimento_km} km)` : ""}.
        </p>
      </div>

      {assistencia && (assistencia.latitude === null || assistencia.longitude === null) && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Não conseguimos localizar o endereço da sua assistência, então você vê trabalhos de qualquer região.{" "}
          <Link href="/dashboard/configuracoes" className="font-medium underline">
            Atualize o endereço
          </Link>{" "}
          para filtrar por raio.
        </p>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {fila.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhum trabalho na fila no momento.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {fila.map((t) => {
          const d = distancia(t);
          return (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {t.marca} {t.modelo} — {t.tipo_reparo}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Estimado: {formatBRL(t.preco_estimado)}
                    {d !== null && ` · a ${d.toFixed(1).replace(".", ",")} km de você`}
                  </p>
                </div>
                <Button disabled={busyId === t.id} onClick={() => aceitar(t.id)}>
                  {busyId === t.id ? "Aceitando..." : "Aceitar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
