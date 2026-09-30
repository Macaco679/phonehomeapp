"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { geocodificar } from "@/lib/geo";
import type { Convite } from "@/lib/types";

const PENDING_KEY = "phonehome_pending_signup";

type PendingSignup = {
  tipo: "cliente" | "assistencia";
  nome: string;
  telefone: string;
  endereco?: string;
  raio?: string;
};

function readPending(): PendingSignup | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

function CompletarCadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user, cliente, assistenciaUsuario, loading, refresh } = useAuth();

  const [tipo, setTipo] = useState<"cliente" | "assistencia">(
    searchParams.get("tipo") === "assistencia" ? "assistencia" : "cliente"
  );
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [raio, setRaio] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);
  const [convite, setConvite] = useState<(Convite & { assistencia_nome?: string }) | null>(null);
  const [conviteChecado, setConviteChecado] = useState(false);

  // Já tem perfil (login normal, ou concluiu cadastro antes) — sai daqui.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (cliente) {
      router.replace("/agendar");
      return;
    }
    if (assistenciaUsuario) {
      router.replace("/dashboard");
    }
  }, [loading, user, cliente, assistenciaUsuario, router]);

  // Convite para entrar na equipe de uma assistência (feito pelo dono, por e-mail).
  useEffect(() => {
    if (loading || !user || cliente || assistenciaUsuario) return;
    (async () => {
      const { data } = await supabase
        .from("marketplace_convites")
        .select("*")
        .eq("status", "pendente")
        .limit(1);
      const c = (data?.[0] as Convite | undefined) ?? null;
      if (c) {
        const { data: ass } = await supabase
          .from("marketplace_assistencias")
          .select("nome")
          .eq("id", c.assistencia_id)
          .maybeSingle();
        setConvite({ ...c, assistencia_nome: ass?.nome });
      }
      setConviteChecado(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, cliente, assistenciaUsuario]);

  // Preenche o formulário com o que a pessoa já tinha digitado no cadastro
  // (fica salvo neste navegador enquanto ela confirma o e-mail).
  useEffect(() => {
    const pending = readPending();
    if (!pending) return;
    setTipo(pending.tipo);
    setNome(pending.nome ?? "");
    setTelefone(pending.telefone ?? "");
    setEndereco(pending.endereco ?? "");
    setRaio(pending.raio ?? "10");
  }, []);

  async function criarPerfil(dados: {
    tipo: "cliente" | "assistencia";
    nome: string;
    telefone: string;
    endereco: string;
    raio: string;
  }) {
    if (!user) return false;

    if (dados.tipo === "cliente") {
      const { error: clienteError } = await supabase.from("marketplace_clientes").insert({
        auth_user_id: user.id,
        nome: dados.nome,
        email: user.email,
        telefone: dados.telefone,
      });
      if (clienteError) {
        setError(clienteError.message);
        return false;
      }
    } else {
      const coords = await geocodificar(dados.endereco);
      const { data: assistencia, error: assistenciaError } = await supabase
        .from("marketplace_assistencias")
        .insert({
          nome: dados.nome,
          endereco: dados.endereco,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          raio_atendimento_km: Number(dados.raio) || 10,
        })
        .select()
        .single();
      if (assistenciaError || !assistencia) {
        setError(assistenciaError?.message ?? "Não foi possível criar a assistência.");
        return false;
      }
      const { error: usuarioError } = await supabase.from("marketplace_usuarios").insert({
        auth_user_id: user.id,
        assistencia_id: assistencia.id,
        papel: "dono",
        nome: dados.nome,
        telefone: dados.telefone,
      });
      if (usuarioError) {
        setError(usuarioError.message);
        return false;
      }
    }

    window.localStorage.removeItem(PENDING_KEY);
    await refresh();
    router.replace(dados.tipo === "assistencia" ? "/dashboard" : "/agendar");
    return true;
  }

  // Se tudo que faltava era criar a linha do perfil (fluxo normal de
  // e-mail/senha, sessão já confirmada), completa sozinho sem pedir de novo.
  useEffect(() => {
    if (loading || !user || cliente || assistenciaUsuario || autoAttempted || !conviteChecado || convite) return;
    const pending = readPending();
    if (!pending || !pending.nome || !pending.telefone) return;
    if (pending.tipo === "assistencia" && !pending.endereco) return;
    setAutoAttempted(true);
    criarPerfil({
      tipo: pending.tipo,
      nome: pending.nome,
      telefone: pending.telefone,
      endereco: pending.endereco ?? "",
      raio: pending.raio ?? "10",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, cliente, assistenciaUsuario, autoAttempted, conviteChecado, convite]);

  async function aceitarConvite() {
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.rpc("marketplace_aceitar_convite", {
      p_nome: nome,
      p_telefone: telefone,
    });
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    window.localStorage.removeItem(PENDING_KEY);
    await refresh();
    router.replace("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    await criarPerfil({ tipo, nome, telefone, endereco, raio });
    setSubmitting(false);
  }

  if (loading || !user || cliente || assistenciaUsuario) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Só mais um passo</CardTitle>
        </CardHeader>
        <CardContent>
          {convite && (
            <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">
                Você foi convidado(a) para a equipe de {convite.assistencia_nome ?? "uma assistência"}.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="convite-nome">Seu nome</Label>
                  <Input id="convite-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="convite-telefone">WhatsApp</Label>
                  <Input id="convite-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={submitting || !nome.trim()}
                  onClick={aceitarConvite}
                >
                  {submitting ? "Entrando..." : "Entrar na equipe"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Ou, se preferir, crie uma conta própria preenchendo os dados abaixo.
              </p>
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600">
            Confirme como você vai usar a Phone Home.
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("cliente")}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium",
                tipo === "cliente"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600"
              )}
            >
              Sou cliente
            </button>
            <button
              type="button"
              onClick={() => setTipo("assistencia")}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium",
                tipo === "assistencia"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600"
              )}
            >
              Sou assistência técnica
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">
                {tipo === "cliente" ? "Nome completo" : "Nome da assistência"}
              </Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="telefone">WhatsApp</Label>
              <Input
                id="telefone"
                required
                placeholder="(11) 91234-5678"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            {tipo === "assistencia" && (
              <>
                <div>
                  <Label htmlFor="endereco">Endereço da assistência</Label>
                  <Textarea
                    id="endereco"
                    required
                    rows={2}
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="raio">Raio de atendimento (km)</Label>
                  <Input
                    id="raio"
                    type="number"
                    min={1}
                    value={raio}
                    onChange={(e) => setRaio(e.target.value)}
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Salvando..." : "Concluir cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletarCadastroPage() {
  return (
    <Suspense fallback={null}>
      <CompletarCadastroForm />
    </Suspense>
  );
}
