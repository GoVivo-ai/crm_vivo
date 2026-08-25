import { cn } from "@/lib/utils";
import type {
  CashflowSummary,
  PnlTotals,
} from "@/modules/finance/domain/types";
import { formatAccountingMoney } from "@/shared/ui/format";

function Row({
  label,
  amount,
  strong = false,
}: {
  label: string;
  amount: number;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-1.5",
        strong && "border-t pt-2 font-medium",
      )}
    >
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "font-mono text-sm",
          amount < 0 && "text-health-critical",
        )}
      >
        {formatAccountingMoney(amount)}
      </span>
    </div>
  );
}

/** Vista tabla del P&L y cashflow del mes — el relevo accesible de los charts. */
export function PnlTable({
  pnl,
  cashflow,
}: {
  pnl: PnlTotals | null;
  cashflow: CashflowSummary | null;
}) {
  if (!pnl && !cashflow) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin snapshot del mes todavía — corre la sincronización de Alegra.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {pnl && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Estado de resultados</p>
          <Row label="Ingresos" amount={pnl.income} />
          <Row label="Costos" amount={pnl.cost} />
          <Row label="Costos de producción" amount={pnl.productionCost} />
          <Row label="Gastos" amount={pnl.expense} />
          <Row label="Resultado neto" amount={pnl.netIncome} strong />
        </div>
      )}
      {cashflow && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Flujo de caja</p>
          <Row label="Saldo inicial" amount={cashflow.initialBalance} />
          <Row label="Entradas" amount={cashflow.income} />
          <Row label="Salidas" amount={cashflow.expenses} />
          <Row label="Balance del periodo" amount={cashflow.periodBalance} />
          <Row label="Saldo final" amount={cashflow.finalBalance} strong />
        </div>
      )}
    </div>
  );
}
