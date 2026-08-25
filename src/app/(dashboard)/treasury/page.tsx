import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import { getTreasuryPosition } from "@/modules/treasury/application/treasury-actions";
import { BankAccountsTable } from "@/modules/treasury/ui/accounts-table";
import { TransactionsTable } from "@/modules/treasury/ui/transactions-table";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";
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

export default async function TreasuryPage() {
  const [position, syncStatus] = await Promise.all([
    getTreasuryPosition(),
    getSyncStatus(),
  ]);
  if (!position.ok) return <ActionError message={position.error} />;

  const { accounts, totalCashCop, recentTransactions, projection } =
    position.data;
  const alegra = syncStatus.ok ? syncStatus.data.alegra : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tesorería</h1>
        <SyncStatus
          source="Alegra"
          syncedAt={alegra?.status === "success" ? alegra.finishedAt : null}
          error={alegra?.status === "error" ? alegra.error : null}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Posición de caja"
          value={totalCashCop}
          kind="accounting"
          size="lg"
          detail="suma de cuentas activas, en COP"
        />
        <Kpi
          label="Cartera por cobrar"
          value={projection.receivablesCop}
          kind="accounting"
        />
        <Kpi
          label="Cuentas por pagar"
          value={projection.payablesCop}
          kind="accounting"
        />
        <Kpi
          label="Proyección neta"
          value={projection.netCop}
          kind="accounting"
          detail="caja + por cobrar − por pagar"
        />
      </div>

      <Panel title="Cuentas">
        {accounts.length === 0 ? (
          <EmptyState
            title="Sin cuentas bancarias"
            hint="Corre la sincronización ERP de Alegra para traer las cuentas y sus saldos."
          />
        ) : (
          <BankAccountsTable accounts={accounts} />
        )}
      </Panel>

      <Panel title="Movimientos recientes">
        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Sin movimientos"
            hint="Los últimos movimientos bancarios aparecerán aquí tras la sincronización."
          />
        ) : (
          <TransactionsTable transactions={recentTransactions} />
        )}
      </Panel>
    </div>
  );
}
