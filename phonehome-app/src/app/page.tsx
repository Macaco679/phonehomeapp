import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

const ATALHOS: { href: string; label: string; icon: IconName; tom: string }[] = [
  { href: "/agendar", label: "Agendar", icon: "calendar", tom: "bg-blue-50 text-blue-600" },
  { href: "/meus-reparos", label: "Meus reparos", icon: "clipboard", tom: "bg-violet-50 text-violet-600" },
  { href: "/loja", label: "Loja", icon: "bag", tom: "bg-amber-50 text-amber-600" },
  { href: "/conta", label: "Minha conta", icon: "user", tom: "bg-emerald-50 text-emerald-600" },
];

const REPAROS = ["Display", "Bateria", "Conector de carga", "Câmera", "Alto-falante", "Vidro traseiro", "Carcaça"];

const PASSOS = [
  { titulo: "Escolha seu aparelho e o reparo", texto: "Modelo, problema e o preço estimado na hora." },
  { titulo: "Uma assistência parceira aceita", texto: "A primeira disponível na sua região assume o serviço." },
  { titulo: "Acompanhe e pague pelo app", texto: "Status em tempo real. Pix, cartão ou na entrega." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:py-10">
      {/* Destaque */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-600/25 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-white/5" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Icon name="bolt" className="h-3.5 w-3.5" />
          Atendimento onde você estiver
        </span>
        <h1 className="relative mt-4 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">
          Seu celular consertado sem sair de casa
        </h1>
        <p className="relative mt-2 max-w-md text-[15px] text-blue-100">
          Agende em minutos. A primeira assistência técnica parceira disponível na sua região aceita e vai até você.
        </p>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/agendar"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-semibold text-blue-700 shadow-sm transition active:scale-[0.98]"
          >
            Agendar meu reparo
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
          <Link
            href="/meus-reparos"
            className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-white/30 px-6 text-base font-semibold text-white transition active:scale-[0.98]"
          >
            Acompanhar reparos
          </Link>
        </div>
      </section>

      {/* Atalhos */}
      <section className="mt-5 grid grid-cols-4 gap-2.5">
        {ATALHOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-1 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition active:scale-95"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tom}`}>
              <Icon name={a.icon} className="h-[22px] w-[22px]" />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight text-slate-700">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Reparos */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900">O que consertamos</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {REPAROS.map((r) => (
            <Link
              key={r}
              href="/agendar"
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition active:scale-95"
            >
              {r}
            </Link>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Preços de iPhone 6 ao 14 Pro Max conforme a tabela da Phone Home.</p>
      </section>

      {/* Como funciona */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900">Como funciona</h2>
        <ol className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className={`flex items-start gap-4 px-4 py-4 ${i > 0 ? "border-t border-slate-100" : ""}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{p.titulo}</p>
                <p className="mt-0.5 text-sm text-slate-500">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Assistência */}
      <section className="mt-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
          <Icon name="wrench" className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight">Tem uma assistência técnica?</h2>
        <p className="mt-1 text-sm text-slate-300">
          Cadastre grátis e receba trabalhos da fila aberta, com OS, estoque e caixa em um só painel.
        </p>
        <Link
          href="/cadastro?tipo=assistencia"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[15px] font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          Cadastrar minha assistência
        </Link>
      </section>
    </div>
  );
}
