import { cn } from "@/lib/utils";
import { formatAccountingMoney } from "@/shared/ui/format";

type StatTileProps = {
  label: string;
  /** Monto COP; null = sin dato (muestra —). */
  amount: number | null;
  /** Texto secundario, p.ej. "12 facturas abiertas". */
  detail?: string;
};

/**
 * KPI de finanzas. Los negativos se muestran en estilo contable
 * (paréntesis) y en color de pérdida — hay meses con pérdida real.
 */
export function StatTile({ label, amount, detail }: StatTileProps) {
  const negative = amount !== null && amount < 0;
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-xl leading-tight",
          negative && "text-health-critical",
        )}
      >
        {amount === null ? "—" : formatAccountingMoney(amount)}
      </p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
