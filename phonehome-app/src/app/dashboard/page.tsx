"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { distanciaKm } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { formatBRL, formatData, type Assistencia, type Trabalho } from "@/lib/types";

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
      <PageHeader
        title="Fila de trabalhos"
        subtitle={`Primeiro que aceitar, leva. Você vê trabalhos dentro do seu raio${assistencia ? ` (${assistencia.raio_atendimento_km} km)` : ""}.`}
        action={
          fila.length > 0 ? (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">{fila.length}</span>
          ) : undefined
        }
      />

      {assistencia && (assistencia.latitude === null || assistencia.longitude === null) && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
          Não conseguimos localizar o endereço da sua assistência, então você vê trabalhos de qualquer região.{" "}
          <Link href="/dashboard/configuracoes" className="font-semibold underline">
            Atualize o endereço
          </Link>{" "}
          para filtrar por raio.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>
      )}

      {fila.length === 0 && (
        <EmptyState
          icon={<Icon name="inbox" className="h-7 w-7" />}
          title="Nenhum trabalho na fila"
          text="Novos pedidos de clientes aparecem aqui na hora, sem precisar atualizar a tela."
        />
      )}

      <div className="space-y-3">
        {fila.map((t) => {
          const d = distancia(t);
          return (
            <Card key={t.id} className="animate-fade-up">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon name="phone" className="h-[22px] w-[22px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold leading-snug text-slate-900">
                        {t.marca} {t.modelo}
                      </p>
                      <p className="text-sm text-slate-500">{t.tipo_reparo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold leading-tight text-slate-900">
                      {t.preco_estimado !== null ? formatBRL(t.preco_estimado) : "Sob consulta"}
                    </p>
                    <p className="text-[11px] text-slate-400">estimado</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">
                      {t.endereco}
                      {d !== null && (
                        <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {d.toFixed(1).replace(".", ",")} km
                        </span>
                      )}
                    </span>
                  </div>
                  {t.horario_preferido && (
                    <div className="flex items-center gap-2">
                      <Icon name="clock" className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{formatData(t.horario_preferido)}</span>
                    </div>
                  )}
                </div>

                <Button size="lg" className="mt-4 w-full" disabled={busyId === t.id} onClick={() => aceitar(t.id)}>
                  {busyId === t.id ? "Aceitando..." : "Aceitar trabalho"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
