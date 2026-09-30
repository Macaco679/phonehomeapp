"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { formatData, type Convite, type UsuarioAssistencia } from "@/lib/types";

export default function EquipePage() {
  const { assistenciaUsuario, user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [membros, setMembros] = useState<UsuarioAssistencia[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ehDono = assistenciaUsuario?.papel === "dono";

  const load = useCallback(async () => {
    if (!assistenciaUsuario) return;
    const aid = assistenciaUsuario.assistencia_id;
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("marketplace_usuarios").select("*").eq("assistencia_id", aid).order("created_at"),
      supabase
        .from("marketplace_convites")
        .select("*")
        .eq("assistencia_id", aid)
        .eq("status", "pendente")
        .order("created_at", { ascending: false }),
    ]);
    setMembros((m as UsuarioAssistencia[]) ?? []);
    setConvites((c as Convite[]) ?? []);
  }, [assistenciaUsuario, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function convidar(e: React.FormEvent) {
    e.preventDefault();
    if (!assistenciaUsuario) return;
    setBusy(true);
    setErro(null);
    setOk(null);
    const alvo = email.trim().toLowerCase();
    const { error } = await supabase
      .from("marketplace_convites")
      .insert({ assistencia_id: assistenciaUsuario.assistencia_id, email: alvo });
    if (error) {
      setErro(
        error.message.includes("duplicate")
          ? "Já existe um convite pendente para este e-mail."
          : error.message
      );
    } else {
      setOk(
        `Convite criado para ${alvo}. Peça para a pessoa criar a conta (ou entrar com Google) usando esse e-mail — ela vai ver o convite ao entrar.`
      );
      setEmail("");
    }
    setBusy(false);
    await load();
  }

  async function cancelarConvite(id: string) {
    await supabase.from("marketplace_convites").update({ status: "cancelado" }).eq("id", id);
    await load();
  }

  async function remover(m: UsuarioAssistencia) {
    if (!confirm(`Remover ${m.nome ?? "este membro"} da equipe?`)) return;
    const { error } = await supabase.from("marketplace_usuarios").delete().eq("id", m.id);
    if (error) setErro(error.message);
    await load();
  }

  if (!assistenciaUsuario) return null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Equipe</h1>

      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {ok && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}

      {ehDono && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Convidar técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={convidar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="convite-email">E-mail do técnico</Label>
                <Input
                  id="convite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tecnico@email.com"
                />
              </div>
              <Button type="submit" disabled={busy}>
                Criar convite
              </Button>
            </form>
            {convites.length > 0 && (
              <ul className="mt-4 space-y-2">
                {convites.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-700">
                      {c.email} <span className="text-xs text-slate-400">· convidado em {formatData(c.created_at)}</span>
                    </span>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => cancelarConvite(c.id)}>
                      cancelar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {membros.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{m.nome ?? "Sem nome"}</p>
                <p className="text-xs text-slate-500">
                  {m.papel === "dono" ? "Dono" : "Técnico"}
                  {m.telefone ? ` · ${m.telefone}` : ""}
                  {m.auth_user_id === user?.id ? " · você" : ""}
                </p>
              </div>
              {ehDono && m.auth_user_id !== user?.id && (
                <Button size="sm" variant="ghost" onClick={() => remover(m)}>
                  Remover
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
