import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="Phone Home"
          width={260}
          height={64}
          priority
          className="mx-auto mb-6 h-14 w-auto"
        />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Conserto de celular onde você estiver
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Agende em minutos. A primeira assistência técnica parceira
          disponível na sua região aceita e vai até você.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/agendar">
            <Button size="lg">Agendar meu reparo</Button>
          </Link>
          <Link href="/meus-reparos">
            <Button size="lg" variant="outline">
              Acompanhar meus reparos
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="mt-1 text-sm font-medium text-slate-900">Agende</p>
            <p className="mt-1 text-sm text-slate-500">
              Marca, modelo, tipo de reparo e endereço.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-blue-600">2</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              Uma assistência aceita
            </p>
            <p className="mt-1 text-sm text-slate-500">
              A primeira parceira disponível na sua região assume o serviço.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-blue-600">3</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              Acompanhe e pague
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Status em tempo real, pague pelo app ou na entrega.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          É dono de uma assistência técnica?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre sua assistência de graça e comece a receber trabalhos da
          fila aberta, além de controlar OS, estoque e caixa em um só painel.
        </p>
        <Link href="/cadastro?tipo=assistencia" className="mt-4 inline-block">
          <Button variant="secondary">Cadastrar minha assistência</Button>
        </Link>
      </div>
    </div>
  );
}
