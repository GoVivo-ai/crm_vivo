import { cn } from "@/lib/utils";
import type {
  CashflowPoint,
  PnlPoint,
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

/** Vista tabla del P&L y flujo del mes — el relevo accesible de los charts. */
export function PnlTable({
  pnl,
  cashflow,
}: {
  pnl: PnlPoint | null;
  cashflow: CashflowPoint | null;
}) {
  if (!pnl && !cashflow) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin registros del mes todavía — registra facturas, gastos y
        movimientos, o conecta QuickBooks.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {pnl && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            Estado de resultados
          </p>
          <Row label="Ingresos" amount={pnl.incomeCop} />
          <Row label="Gastos" amount={pnl.expensesCop} />
          <Row label="Nómina" amount={pnl.payrollCop} />
          <Row label="Resultado neto" amount={pnl.netIncomeCop} strong />
        </div>
      )}
      {cashflow && (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Flujo de caja</p>
          <Row label="Entradas" amount={cashflow.inflowCop} />
          <Row label="Salidas" amount={cashflow.outflowCop} />
          <Row label="Flujo neto" amount={cashflow.netCop} strong />
        </div>
      )}
    </div>
  );
}
