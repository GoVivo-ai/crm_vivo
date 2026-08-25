import { MoveDownRight, MoveUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricTileProps = {
  label: string;
  /** Valor ya formateado (número, moneda o multi-moneda en líneas). */
  value: React.ReactNode;
  /** % de cambio vs el periodo anterior; null = sin base de comparación. */
  deltaPct: number | null;
  /** Dirección que es buena noticia: leads sube, costo por lead baja. */
  goodWhen: "up" | "down";
  /** Métrica principal del negocio (leads): tile destacado. */
  emphasis?: boolean;
};

export function MetricTile({
  label,
  value,
  deltaPct,
  goodWhen,
  emphasis = false,
}: MetricTileProps) {
  const isGood =
    deltaPct !== null &&
    deltaPct !== 0 &&
    (deltaPct > 0) === (goodWhen === "up");

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-card p-4",
        emphasis && "border-module-marketing/40",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={cn("font-mono leading-tight", emphasis ? "text-2xl" : "text-xl")}>
        {value}
      </div>
      {deltaPct !== null && (
        <p
          className={cn(
            "flex items-center gap-1 text-xs",
            deltaPct === 0
              ? "text-muted-foreground"
              : isGood
                ? "text-health-ok"
                : "text-health-critical",
          )}
        >
          {deltaPct > 0 ? (
            <MoveUpRight className="size-3" />
          ) : deltaPct < 0 ? (
            <MoveDownRight className="size-3" />
          ) : null}
          {deltaPct > 0 ? "+" : ""}
          {deltaPct.toFixed(1)}% vs periodo anterior
        </p>
      )}
    </div>
  );
}
