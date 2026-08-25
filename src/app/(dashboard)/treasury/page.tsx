import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import { getTreasuryPosition } from "@/modules/treasury/application/treasury-actions";
import { BankAccountsTable } from "@/modules/treasury/ui/accounts-table";
import { BankAccountForm } from "@/modules/treasury/ui/bank-account-form";
import { TransactionForm } from "@/modules/treasury/ui/transaction-form";
import { TransactionsTable } from "@/modules/treasury/ui/transactions-table";
import { ActionError } from "@/shared/ui/action-error";
import { RequiresWrite, hasWrite } from "@/shared/ui/requires-write";
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
  const [position, syncStatus, canWrite] = await Promise.all([
    getTreasuryPosition(),
    getSyncStatus(),
    hasWrite("treasury"),
  ]);
  if (!position.ok) return <ActionError message={position.error} />;

  const { accounts, totalCashCop, recentTransactions, projection } =
    position.data;
  const quickbooks = syncStatus.ok ? syncStatus.data.quickbooks : null;
  const accountOptions = accounts
    .filter((a) => a.isActive && a.source === "manual")
    .map(({ id, name }) => ({ id, name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tesorería</h1>
        <div className="flex items-center gap-2">
          <SyncStatus
            source="QuickBooks"
            syncedAt={
              quickbooks?.status === "success" ? quickbooks.finishedAt : null
            }
            error={quickbooks?.status === "error" ? quickbooks.error : null}
          />
          <RequiresWrite resource="treasury">
            <BankAccountForm />
            <TransactionForm accounts={accountOptions} />
          </RequiresWrite>
        </div>
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
            hint="Crea tus cuentas con su saldo actual, o conecta QuickBooks para traerlas."
            action={
              canWrite ? (
                <RequiresWrite resource="treasury">
                  <BankAccountForm />
                </RequiresWrite>
              ) : undefined
            }
          />
        ) : (
          <BankAccountsTable accounts={accounts} canWrite={canWrite} />
        )}
      </Panel>

      <Panel title="Movimientos recientes">
        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Sin movimientos"
            hint="Registra entradas y salidas con + Movimiento — alimentan el flujo de caja."
          />
        ) : (
          <TransactionsTable
            transactions={recentTransactions}
            canWrite={canWrite}
          />
        )}
      </Panel>
    </div>
  );
}
