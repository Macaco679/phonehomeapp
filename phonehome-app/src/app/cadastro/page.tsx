"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [tipo, setTipo] = useState<"cliente" | "assistencia">(
    searchParams.get("tipo") === "assistencia" ? "assistencia" : "cliente"
  );
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [endereco, setEndereco] = useState("");
  const [raio, setRaio] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Não foi possível criar a conta.");
      return;
    }

    if (tipo === "cliente") {
      const { error: clienteError } = await supabase
        .from("marketplace_clientes")
        .insert({ auth_user_id: data.user.id, nome, email, telefone });
      if (clienteError) {
        setLoading(false);
        setError(clienteError.message);
        return;
      }
    } else {
      const { data: assistencia, error: assistenciaError } = await supabase
        .from("marketplace_assistencias")
        .insert({ nome, endereco, raio_atendimento_km: Number(raio) || 10 })
        .select()
        .single();
      if (assistenciaError || !assistencia) {
        setLoading(false);
        setError(assistenciaError?.message ?? "Não foi possível criar a assistência.");
        return;
      }
      const { error: usuarioError } = await supabase
        .from("marketplace_usuarios")
        .insert({
          auth_user_id: data.user.id,
          assistencia_id: assistencia.id,
          papel: "dono",
          nome,
          telefone,
        });
      if (usuarioError) {
        setLoading(false);
        setError(usuarioError.message);
        return;
      }
    }

    setLoading(false);
    if (data.session) {
      router.push(tipo === "assistencia" ? "/dashboard" : "/agendar");
      router.refresh();
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-medium text-slate-900">Quase lá!</p>
          <p className="mt-1 text-sm text-slate-600">
            Confirme seu cadastro pelo link que enviamos para {email} antes de
            entrar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-blue-600">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function CadastroPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Suspense fallback={null}>
        <CadastroForm />
      </Suspense>
    </div>
  );
}
