import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  CashflowPoint,
  FinanceDashboard,
} from "@/modules/finance/domain/types";
import type { TreasuryPosition } from "@/modules/treasury/domain/types";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";
import {
  formatAccountingMoney,
  formatCompactMoney,
} from "@/shared/ui/format";

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const span = max - min || 1;
  const W = 520;
  const H = 44;
  const step = W / (points.length - 1);
  const y = (v: number) => H - ((v - min) / span) * (H - 6) - 3;
  const line = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="mt-2 block h-11 w-full"
      aria-hidden
    >
      <path
        d={`${line} L${W} ${H} L0 ${H} Z`}
        fill="#069B66"
        fillOpacity="0.12"
      />
      <path
        d={line}
        fill="none"
        stroke="#069B66"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

type MoneyFranjaProps = {
  finance: FinanceDashboard;
  treasury: TreasuryPosition | null;
  cashflowSeries: CashflowPoint[];
};

/** Franja dominante Finanzas · Tesorería (única con gradiente firma). */
export function MoneyFranja({
  finance,
  treasury,
  cashflowSeries,
}: MoneyFranjaProps) {
  const net = finance.pnlCurrentMonth?.netIncomeCop ?? null;
  const cashNow = treasury?.totalCashCop ?? null;
  // Saldo al cierre de mes reconstruido hacia atrás desde el saldo actual
  // restando el flujo neto de cada mes (decisión del diseñador, §10).
  const balances: number[] = [];
  if (cashNow !== null && cashflowSeries.length > 0) {
    let acc = cashNow;
    for (let i = cashflowSeries.length - 1; i >= 0; i--) {
      balances[i] = acc;
      acc -= cashflowSeries[i].netCop;
    }
  }
  const overdue = finance.receivables.aging
    .filter((b) => b.bucket !== "current")
    .reduce((s, b) => s + b.amountCop, 0);
  const cash = cashNow;

  // Cobertura: caja / gasto mensual promedio (gastos+nómina, 3 meses).
  const monthlyBurn = avgBurn(finance);
  const coverage =
    cash !== null && monthlyBurn > 0 ? cash / monthlyBurn : null;

  const verdict: Veredicto =
    (cash !== null && cash < 0) || (net !== null && net < 0)
      ? "problema"
      : overdue > 0 || (coverage !== null && coverage < 1)
        ? "atencion"
        : "bien";

  return (
    <Franja
      dot="var(--module-finance)"
      label="Finanzas · Tesorería"
      verdict={verdict}
      href="/finance"
      linkLabel="Abrir Finanzas"
      signature
    >
      <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr_1.2fr] lg:divide-x lg:divide-[var(--border)]">
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Caja disponible
          </p>
          <p
            className={cn(
              "mt-1 font-[family-name:var(--font-display)] text-[36px] leading-none font-extrabold tracking-tight tabular-nums",
              cash !== null && cash < 0 && "text-health-critical",
            )}
          >
            {cash !== null ? formatAccountingMoney(cash) : "—"}
          </p>
          {balances.length > 1 && <Sparkline points={balances} />}
          <p className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">
            {coverage !== null
              ? `Cubre ${coverage.toFixed(1).replace(".", ",")} meses de operación`
              : "Registra gastos para calcular cobertura"}
            {balances.length > 1 && " · saldo al cierre de mes, últimos 12 m"}
          </p>
        </div>
        <div className="lg:pl-7">
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Resultado del mes
          </p>
          <p
            className={cn(
              "mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums",
              net !== null && net < 0
                ? "text-health-critical"
                : "text-health-ok",
            )}
          >
            {net !== null ? formatAccountingMoney(net) : "—"}
          </p>
          {finance.pnlCurrentMonth && (
            <p className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">
              Ingresos {formatCompactMoney(finance.pnlCurrentMonth.incomeCop)} ·
              gastos {formatCompactMoney(finance.pnlCurrentMonth.expensesCop)} ·
              nómina {formatCompactMoney(finance.pnlCurrentMonth.payrollCop)}
            </p>
          )}
        </div>
        <div className="lg:pl-7">
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Cartera
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
            {formatAccountingMoney(finance.receivables.outstandingCop)}
          </p>
          <p className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">
            {finance.receivables.openInvoices} facturas abiertas
            {overdue > 0 && (
              <span className="text-health-critical">
                {" "}
                · {formatCompactMoney(overdue)} vencida
              </span>
            )}
          </p>
          {overdue > 0 && (
            <Link
              href="/finance/invoices?status=open"
              className="mt-2 inline-block text-xs font-extrabold text-health-critical hover:underline"
            >
              Gestionar cobros vencidos →
            </Link>
          )}
        </div>
      </div>
    </Franja>
  );
}

function avgBurn(finance: FinanceDashboard): number {
  const p = finance.pnlCurrentMonth;
  if (!p) return 0;
  return p.expensesCop + p.payrollCop;
}
