import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado como los Input de shadcn. Se prefiere sobre el
 * Select de Base UI para formularios simples: cero sorpresas de API y
 * accesible por defecto.
 */
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "border-input bg-transparent h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
