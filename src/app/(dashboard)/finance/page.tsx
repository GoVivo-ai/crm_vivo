import Link from "next/link";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import {
  getCashflowSeries,
  getFinanceDashboard,
  getPnlSeries,
  getSyncStatus,
} from "@/modules/finance/application/finance-actions";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { RequiresWrite } from "@/shared/ui/requires-write";
import { AgingChart } from "@/modules/finance/ui/aging-chart";
import { BillingChart } from "@/modules/finance/ui/billing-chart";
import { CashflowChart } from "@/modules/finance/ui/cashflow-chart";
import { PnlChart } from "@/modules/finance/ui/pnl-chart";
import { PnlTable } from "@/modules/finance/ui/pnl-table";
import { StatTile } from "@/modules/finance/ui/stat-tile";
import { ActionError } from "@/shared/ui/action-error";
import { Kpi } from "@/shared/ui/kpi";
import { SyncStatus } from "@/shared/ui/sync-status";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function FinancePage() {
  const [dashboard, pnlSeries, cashflowSeries, syncStatus, accountsResult] =
    await Promise.all([
      getFinanceDashboard(),
      getPnlSeries(12),
      getCashflowSeries(12),
      getSyncStatus(),
      listAccounts(),
    ]);
  if (!dashboard.ok) return <ActionError message={dashboard.error} />;
  const accountOptions = accountsResult.ok
    ? accountsResult.data.map(({ id, name }) => ({ id, name }))
    : [];

  const { billing, receivables, pnlCurrentMonth, cashflowCurrentMonth } =
    dashboard.data;
  const lastMonth = billing.at(-1) ?? null;
  const quickbooks = syncStatus.ok ? syncStatus.data.quickbooks : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <div className="flex items-center gap-3">
          <SyncStatus
            source="QuickBooks"
            syncedAt={
              quickbooks?.status === "success" ? quickbooks.finishedAt : null
            }
            error={quickbooks?.status === "error" ? quickbooks.error : null}
          />
          <Link
            href="/finance/invoices"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver facturas
          </Link>
          <RequiresWrite resource="finance">
            <InvoiceForm accounts={accountOptions} />
          </RequiresWrite>
        </div>
      </div>

      {/* Jerarquía del artboard Finanzas: Ingresos héroe · Gastos · Resultado
          (distinguido por COLOR verde, no tamaño) · Cartera. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <StatTile
          label="Ingresos del mes"
          amount={pnlCurrentMonth?.incomeCop ?? null}
          detail={lastMonth ? `${lastMonth.invoices} facturas` : undefined}
          emphasis
        />
        <StatTile
          label="Gastos del mes"
          amount={
            pnlCurrentMonth
              ? pnlCurrentMonth.expensesCop + pnlCurrentMonth.payrollCop
              : null
          }
          detail="gastos + nómina"
        />
        <Kpi
          label="Resultado operativo"
          value={pnlCurrentMonth?.netIncomeCop ?? null}
          kind="accounting"
          colorBySign
          detail={
            pnlCurrentMonth && pnlCurrentMonth.incomeCop > 0
              ? `margen ${((pnlCurrentMonth.netIncomeCop / pnlCurrentMonth.incomeCop) * 100).toFixed(1)}%`
              : undefined
          }
        />
        <StatTile
          label="Cartera viva"
          amount={receivables.outstandingCop}
          detail={`${receivables.openInvoices} facturas abiertas`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Facturación · últimos 12 meses">
          <BillingChart billing={billing} />
        </Panel>
        <Panel title="Aging de cartera">
          <AgingChart aging={receivables.aging} />
        </Panel>
        <Panel title="Resultado neto · 12 meses">
          <PnlChart series={pnlSeries.ok ? pnlSeries.data : []} />
        </Panel>
        <Panel title="Flujo de caja · 12 meses">
          <CashflowChart
            series={cashflowSeries.ok ? cashflowSeries.data : []}
          />
        </Panel>
      </div>

      <Panel title="P&L del mes en curso">
        <PnlTable pnl={pnlCurrentMonth} cashflow={cashflowCurrentMonth} />
      </Panel>
    </div>
  );
}
