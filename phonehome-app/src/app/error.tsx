"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
        <Icon name="help" className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-500">
        Não conseguimos carregar esta tela. Verifique sua conexão e tente de novo.
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button onClick={reset} size="lg">
          Tentar de novo
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg" className="w-full">
            Ir para o início
          </Button>
        </Link>
      </div>
    </div>
  );
}
