import Link from "next/link";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import {
  getCashflowSeries,
  getFinanceDashboard,
  getPnlSeries,
  getSyncStatus,
} from "@/modules/finance/application/finance-actions";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { AgingChart } from "@/modules/finance/ui/aging-chart";
import { BillingChart } from "@/modules/finance/ui/billing-chart";
import { CashflowChart } from "@/modules/finance/ui/cashflow-chart";
import { PnlChart } from "@/modules/finance/ui/pnl-chart";
import { PnlTable } from "@/modules/finance/ui/pnl-table";
import { StatTile } from "@/modules/finance/ui/stat-tile";
import { ActionError } from "@/shared/ui/action-error";
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
          <InvoiceForm accounts={accountOptions} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Facturación del mes"
          amount={lastMonth?.totalCop ?? null}
          detail={lastMonth ? `${lastMonth.invoices} facturas` : undefined}
        />
        <StatTile
          label="Cartera viva"
          amount={receivables.outstandingCop}
          detail={`${receivables.openInvoices} facturas abiertas`}
        />
        <StatTile
          label="Resultado neto del mes"
          amount={pnlCurrentMonth?.netIncomeCop ?? null}
          emphasis
        />
        <StatTile
          label="Flujo neto del mes"
          amount={cashflowCurrentMonth?.netCop ?? null}
          detail="desde movimientos bancarios"
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
