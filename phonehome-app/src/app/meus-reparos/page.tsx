"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { STATUS_LABEL, formatBRL, type Trabalho } from "@/lib/types";

export default function MeusReparosPage() {
  const { user, cliente, loading } = useAuth();
  const supabase = createClient();
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!cliente) return;
    const { data } = await supabase
      .from("marketplace_trabalhos")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false });
    setTrabalhos((data as Trabalho[]) ?? []);
  }, [cliente, supabase]);

  useEffect(() => {
    load();
    if (!cliente) return;
    const channel = supabase
      .channel("meus-reparos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_trabalhos",
          filter: `cliente_id=eq.${cliente.id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente, load, supabase]);

  async function cancelar(id: string) {
    setBusy(true);
    await supabase
      .from("marketplace_trabalhos")
      .update({ status: "cancelado" })
      .eq("id", id);
    await load();
    setBusy(false);
  }

  if (loading) return null;

  if (!user || !cliente) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Entre para ver seus reparos
        </h1>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Meus reparos</h1>
        <Link href="/agendar">
          <Button size="sm">Novo agendamento</Button>
        </Link>
      </div>

      {trabalhos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Você ainda não agendou nenhum reparo.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {trabalhos.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {t.marca} {t.modelo} — {t.tipo_reparo}
                </p>
                <p className="mt-1 text-sm text-slate-500">{t.endereco}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {t.valor_final ? formatBRL(t.valor_final) : formatBRL(t.preco_estimado)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge status={t.status}>{STATUS_LABEL[t.status]}</Badge>
                {t.status === "fila" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => cancelar(t.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
