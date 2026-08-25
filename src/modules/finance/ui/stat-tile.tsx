import { Kpi } from "@/shared/ui/kpi";

type StatTileProps = {
  label: string;
  /** Monto COP; null = sin dato (muestra —). */
  amount: number | null;
  /** Texto secundario, p.ej. "12 facturas abiertas". */
  detail?: string;
  /** Cifra protagonista del dashboard. */
  emphasis?: boolean;
};

/**
 * KPI financiero en estilo contable: negativos entre paréntesis y en color
 * de pérdida (hay meses con pérdida real), con transición animada de cifra.
 */
export function StatTile({ label, amount, detail, emphasis }: StatTileProps) {
  return (
    <Kpi
      label={label}
      value={amount}
      kind="accounting"
      detail={detail}
      size={emphasis ? "lg" : "md"}
    />
  );
}
