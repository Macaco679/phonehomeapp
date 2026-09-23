"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, type Trabalho } from "@/lib/types";

export default function FilaDeTrabalhosPage() {
  const { assistenciaUsuario } = useAuth();
  const supabase = createClient();
  const [fila, setFila] = useState<Trabalho[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_trabalhos")
      .select("*")
      .eq("status", "fila")
      .order("created_at", { ascending: true });
    setFila((data as Trabalho[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("fila-de-trabalhos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketplace_trabalhos" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  async function aceitar(id: string) {
    setBusyId(id);
    setError(null);
    const { error } = await supabase
      .from("marketplace_trabalhos")
      .update({ status: "aceito" })
      .eq("id", id);
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

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Fila de trabalhos disponíveis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Primeiro que aceitar, leva. Assim que você aceita, o trabalho vira
          uma ordem de serviço sua.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {fila.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Nenhum trabalho na fila no momento.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {fila.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {t.marca} {t.modelo} — {t.tipo_reparo}
                </p>
                <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Estimado: {formatBRL(t.preco_estimado)}
                </p>
              </div>
              <Button disabled={busyId === t.id} onClick={() => aceitar(t.id)}>
                {busyId === t.id ? "Aceitando..." : "Aceitar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
