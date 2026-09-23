import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-xl border border-slate-200 bg-white shadow-sm",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-slate-100 p-4", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold text-slate-900", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4", className)} {...props} />
);

const badgeColors: Record<string, string> = {
  fila: "bg-amber-100 text-amber-800",
  aceito: "bg-blue-100 text-blue-800",
  a_caminho: "bg-indigo-100 text-indigo-800",
  em_reparo: "bg-purple-100 text-purple-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-slate-200 text-slate-600",
  ativa: "bg-emerald-100 text-emerald-800",
  pausada: "bg-slate-200 text-slate-600",
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
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
      status ? badgeColors[status] ?? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700",
      className
    )}
  >
    {children}
  </span>
);
