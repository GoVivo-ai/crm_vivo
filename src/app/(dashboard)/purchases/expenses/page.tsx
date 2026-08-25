import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { listExpenses } from "@/modules/purchases/application/purchases-actions";
import { ExpenseForm } from "@/modules/purchases/ui/expense-form";
import { ExpensesTable } from "@/modules/purchases/ui/expenses-table";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function ExpensesPage() {
  const result = await listExpenses();
  if (!result.ok) return <ActionError message={result.error} />;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/purchases"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Gastos y compras
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Gastos registrados</h1>
        <ExpenseForm />
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="Sin gastos"
          hint="Registra tu primer gasto o conecta QuickBooks para traerlos."
          action={<ExpenseForm />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <ExpensesTable expenses={result.data} />
        </div>
      )}
    </div>
  );
}
