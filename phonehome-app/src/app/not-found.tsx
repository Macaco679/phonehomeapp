import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
        <Icon name="phone" className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-slate-500">O endereço que você abriu não existe ou foi removido.</p>
      <Link href="/" className="mt-6 w-full">
        <Button size="lg" className="w-full">
          Voltar para o início
        </Button>
      </Link>
    </div>
  );
}
