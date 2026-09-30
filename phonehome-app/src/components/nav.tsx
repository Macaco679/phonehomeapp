"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function Nav() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function sair() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
      <Link href="/agendar" className="hover:text-blue-600">
        Agendar reparo
      </Link>
      <Link href="/loja" className="hover:text-blue-600">
        Loja
      </Link>
      <Link href="/meus-reparos" className="hover:text-blue-600">
        Meus reparos
      </Link>
      <Link href="/meus-pedidos" className="hover:text-blue-600">
        Meus pedidos
      </Link>
      <Link href="/dashboard" className="hover:text-blue-600">
        Sou assistência
      </Link>
      {!loading &&
        (user ? (
          <button onClick={sair} className="text-slate-500 hover:text-red-600">
            Sair
          </button>
        ) : (
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Entrar
          </Link>
        ))}
    </nav>
  );
}
