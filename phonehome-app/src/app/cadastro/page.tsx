"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthScreen } from "@/components/auth/auth-screen";

const PENDING_KEY = "phonehome_pending_signup";

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
      options: {
        emailRedirectTo: `${window.location.origin}/completar-cadastro`,
      },
    });
    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Não foi possível criar a conta.");
      return;
    }

    // Os dados do formulário ficam guardados neste navegador e o perfil é criado
    // em /completar-cadastro: já, se a conta tem sessão; ou assim que a pessoa
    // confirmar o e-mail e voltar autenticada (o banco exige usuário logado).
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ tipo, nome, telefone, endereco, raio })
    );
    setLoading(false);
    if (data.session) {
      router.push("/completar-cadastro");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthScreen titulo="Quase lá!" subtitulo="Falta só confirmar seu e-mail.">
        <div className="py-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
              <path d="m4.5 8 7.5 5.5L19.5 8" />
            </svg>
          </span>
          <p className="mt-4 text-base font-semibold text-slate-900">Enviamos um link para</p>
          <p className="text-sm font-medium text-blue-600">{email}</p>
          <p className="mt-2 text-sm text-slate-500">Confirme seu cadastro por ele antes de entrar.</p>
          <Link href="/login" className="mt-6 block">
            <Button variant="outline" size="lg" className="w-full">
              Ir para o login
            </Button>
          </Link>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <div>
        <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => setTipo("cliente")}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              tipo === "cliente" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            )}
          >
            Sou cliente
          </button>
          <button
            type="button"
            onClick={() => setTipo("assistencia")}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              tipo === "assistencia" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            )}
          >
            Sou assistência
          </button>
        </div>

        <GoogleButton
          redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/completar-cadastro?tipo=${tipo}`}
          onError={setError}
        />
        <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          ou preencha seus dados
          <div className="h-px flex-1 bg-slate-200" />
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
          {error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-blue-600">
            Entrar
          </Link>
        </p>
      </div>
    </AuthScreen>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroForm />
    </Suspense>
  );
}
