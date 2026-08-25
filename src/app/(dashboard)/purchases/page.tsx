import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import { AgingChart } from "@/modules/finance/ui/aging-chart";
import { StatTile } from "@/modules/finance/ui/stat-tile";
import { getPurchasesDashboard } from "@/modules/purchases/application/purchases-actions";
import { ExpenseForm } from "@/modules/purchases/ui/expense-form";
import { SpendChart } from "@/modules/purchases/ui/spend-chart";
import {
  CostCenterTable,
  ProviderTable,
} from "@/modules/purchases/ui/spend-tables";
import { ActionError } from "@/shared/ui/action-error";
import { RequiresWrite } from "@/shared/ui/requires-write";
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

export default async function PurchasesPage({
  searchParams,
}: PageProps<"/purchases">) {
  const params = await searchParams;
  const from = typeof params.from === "string" && params.from ? params.from : null;
  const to = typeof params.to === "string" && params.to ? params.to : null;

  const [dashboard, syncStatus] = await Promise.all([
    getPurchasesDashboard({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    getSyncStatus(),
  ]);
  if (!dashboard.ok) return <ActionError message={dashboard.error} />;

  const { period, spendByMonth, byCostCenter, byProvider, payables } =
    dashboard.data;
  const currentMonth = spendByMonth.at(-1) ?? null;
  const quickbooks = syncStatus.ok ? syncStatus.data.quickbooks : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mt-1 text-xs text-muted-foreground">
            Periodo: {period.from} → {period.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus
            source="QuickBooks"
            syncedAt={
              quickbooks?.status === "success" ? quickbooks.finishedAt : null
            }
            error={quickbooks?.status === "error" ? quickbooks.error : null}
          />
          <Link
            href="/purchases/expenses"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver gastos
          </Link>
          <RequiresWrite resource="purchases">
            <ExpenseForm />
          </RequiresWrite>
        </div>
      </div>

      <form
        action="/purchases"
        className="flex flex-wrap items-end gap-2"
        aria-label="Filtro de periodo"
      >
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <Input type="date" name="from" defaultValue={from ?? ""} className="w-36" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <Input type="date" name="to" defaultValue={to ?? ""} className="w-36" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Aplicar
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Gasto del mes"
          amount={currentMonth?.totalCop ?? null}
          detail={currentMonth ? `${currentMonth.expenses} gastos` : undefined}
        />
        <StatTile
          label="Por pagar"
          amount={payables.outstandingCop}
          detail={`${payables.openBills} facturas abiertas`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Gasto · últimos 12 meses">
          <SpendChart spend={spendByMonth} />
        </Panel>
        <Panel title="Aging de cuentas por pagar">
          <AgingChart aging={payables.aging} />
        </Panel>
        <Panel title="Por centro de costo (periodo)">
          {byCostCenter.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin gastos en el periodo.
            </p>
          ) : (
            <CostCenterTable rows={byCostCenter} />
          )}
        </Panel>
        <Panel title="Top proveedores (periodo)">
          {byProvider.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin proveedores en el periodo.
            </p>
          ) : (
            <ProviderTable rows={byProvider} />
          )}
        </Panel>
      </div>
    </div>
  );
}
