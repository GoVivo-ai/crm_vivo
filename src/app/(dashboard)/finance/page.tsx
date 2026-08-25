import {
  getCashflowSeries,
  getFinanceDashboard,
  getPnlSeries,
  getSyncStatus,
} from "@/modules/finance/application/finance-actions";
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
  const [dashboard, pnlSeries, cashflowSeries, syncStatus] = await Promise.all([
    getFinanceDashboard(),
    getPnlSeries(90),
    getCashflowSeries(90),
    getSyncStatus(),
  ]);
  if (!dashboard.ok) return <ActionError message={dashboard.error} />;

  const { billing, receivables, pnlCurrentMonth, cashflowCurrentMonth } =
    dashboard.data;
  const lastMonth = billing.at(-1) ?? null;
  const alegra = syncStatus.ok ? syncStatus.data.alegra : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <SyncStatus
          source="Alegra"
          syncedAt={alegra?.status === "success" ? alegra.finishedAt : null}
          error={alegra?.status === "error" ? alegra.error : null}
        />
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
          amount={pnlCurrentMonth?.netIncome ?? null}
        />
        <StatTile
          label="Saldo en bancos"
          amount={cashflowCurrentMonth?.finalBalance ?? null}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Facturación · últimos 12 meses">
          <BillingChart billing={billing} />
        </Panel>
        <Panel title="Aging de cartera">
          <AgingChart aging={receivables.aging} />
        </Panel>
        <Panel title="Resultado neto · 90 días">
          <PnlChart series={pnlSeries.ok ? pnlSeries.data : []} />
        </Panel>
        <Panel title="Saldo en bancos · 90 días">
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
