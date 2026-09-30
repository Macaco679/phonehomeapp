import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-slate-100 p-4 sm:px-5", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold tracking-tight text-slate-900", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4 sm:p-5", className)} {...props} />
);

const badgeColors: Record<string, string> = {
  fila: "bg-amber-50 text-amber-700 ring-amber-200",
  aceito: "bg-blue-50 text-blue-700 ring-blue-200",
  a_caminho: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  em_reparo: "bg-violet-50 text-violet-700 ring-violet-200",
  concluido: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelado: "bg-slate-100 text-slate-600 ring-slate-200",
  ativa: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pausada: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const Badge = ({
  status,
  children,
  className,
}: {
  status?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
      status ? badgeColors[status] ?? "bg-slate-50 text-slate-700 ring-slate-200" : "bg-slate-50 text-slate-700 ring-slate-200",
      className
    )}
  >
    {children}
  </span>
);

// Cabeçalho de tela (título grande, como em apps)
export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="mb-5 flex items-end justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Estado vazio amigável
export const EmptyState = ({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
    {icon && <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</span>}
    <p className="text-base font-semibold text-slate-900">{title}</p>
    {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
