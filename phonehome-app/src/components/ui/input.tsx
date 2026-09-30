import * as React from "react";
import { cn } from "@/lib/utils";

// text-base no celular evita o zoom automático do iPhone ao focar no campo.
const campo =
  "w-full rounded-xl border border-slate-200 bg-white text-base text-slate-900 shadow-[0_1px_1px_rgba(15,23,42,0.03)] placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 sm:text-sm";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(campo, "h-12 px-3.5 sm:h-11", className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(campo, "px-3.5 py-3", className)} {...props} />
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(campo, "h-12 px-3 sm:h-11", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-semibold text-slate-700", className)} {...props} />
);
