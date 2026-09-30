import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ItemMenu = {
  href?: string;
  onClick?: () => void;
  icon: IconName;
  titulo: string;
  texto?: string;
  tom?: "azul" | "roxo" | "vermelho" | "cinza";
};

const TOM: Record<NonNullable<ItemMenu["tom"]>, string> = {
  azul: "bg-blue-50 text-blue-600",
  roxo: "bg-violet-50 text-violet-600",
  vermelho: "bg-red-50 text-red-600",
  cinza: "bg-slate-100 text-slate-600",
};

// Lista de opções estilo configurações de celular.
export function MenuList({ itens }: { itens: ItemMenu[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {itens.map((item, i) => {
        const conteudo = (
          <>
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TOM[item.tom ?? "azul"])}>
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className={cn("block text-[15px] font-semibold", item.tom === "vermelho" ? "text-red-600" : "text-slate-900")}>
                {item.titulo}
              </span>
              {item.texto && <span className="block truncate text-xs text-slate-500">{item.texto}</span>}
            </span>
            <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-300" />
          </>
        );
        const classe = cn(
          "flex w-full items-center gap-3 px-4 py-3 transition active:bg-slate-50 hover:bg-slate-50/70",
          i > 0 && "border-t border-slate-100"
        );
        return (
          <li key={item.titulo}>
            {item.href ? (
              <Link href={item.href} className={classe}>
                {conteudo}
              </Link>
            ) : (
              <button type="button" onClick={item.onClick} className={classe}>
                {conteudo}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
