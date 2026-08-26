import { cn } from "@/lib/utils";
import type { Expense } from "@/modules/purchases/domain/types";
import { ExpenseRowActions } from "@/modules/purchases/ui/expense-row-actions";
import { formatIsoDate } from "@/modules/people/ui/file/helpers";
import { IdentityCell, LIST_TH, ListFooter } from "@/shared/ui/entity/list-bits";
import { formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const STATUS: Record<Expense["status"], { label: string; cls: string }> = {
  open: { label: "Por pagar", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
  paid: { label: "Pagada", cls: "bg-[#E6F9F1] text-[#069B66]" },
  void: { label: "Anulada", cls: "bg-[#EEF1F6] text-[#5A6B85]" },
};

/** Gastos al sistema §15.2: celda identidad, badges de tinta, fechas
 * es-CO, tabular; acciones en menú ⋯ (solo manuales). */
export function ExpensesTable({
  expenses,
  canWrite,
  total,
}: {
  expenses: Expense[];
  /** purchases:write — sin él no se monta el menú de acciones. */
  canWrite: boolean;
  total: number;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] font-semibold">
          <thead>
            <tr className="border-b">
              <th className={LIST_TH}>Proveedor</th>
              <th className={LIST_TH}>Fecha</th>
              <th className={LIST_TH}>Centro de costo</th>
              <th className={`${LIST_TH} text-right`}>Total</th>
              <th className={LIST_TH}>Fuente</th>
              <th className={LIST_TH}>Estado</th>
              <th className={LIST_TH} aria-hidden />
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const st = STATUS[expense.status];
              return (
                <tr
                  key={expense.id}
                  className={cn(
                    "border-b border-[#EDF0F5] last:border-b-0",
                    expense.status === "void" && "opacity-60",
                  )}
                >
                  <td className="px-5 py-3">
                    <IdentityCell
                      id={expense.providerName}
                      name={expense.providerName}
                      sub={expense.kind === "bill" ? "Factura a crédito" : "Gasto directo"}
                    />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {formatIsoDate(expense.txnDate)}
                  </td>
                  <td className="px-5 py-3">
                    {expense.costCenter ?? (
                      <span className="font-extrabold text-[#8C7A0A]">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold whitespace-nowrap tabular-nums">
                    {formatCurrency(expense.total, expense.currencyCode)}
                  </td>
                  <td className="px-5 py-3">
                    <SourceBadge source={expense.source} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                    {expense.kind === "bill" && expense.dueDate && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">
                        vence {formatIsoDate(expense.dueDate)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canWrite && expense.source === "manual" && (
                      <ExpenseRowActions expense={expense} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ListFooter shown={expenses.length} total={total} />
    </>
  );
}
