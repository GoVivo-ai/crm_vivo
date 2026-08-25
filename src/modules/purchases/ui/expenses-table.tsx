import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteExpense } from "@/modules/purchases/application/purchases-actions";
import type { Expense } from "@/modules/purchases/domain/types";
import { ExpenseForm } from "@/modules/purchases/ui/expense-form";
import { DeleteRecordButton } from "@/shared/ui/delete-record-button";
import { formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const STATUS_LABELS: Record<Expense["status"], string> = {
  open: "Por pagar",
  paid: "Pagada",
  void: "Anulada",
};

/** Gastos registrados; los manuales se editan/borran, QB solo lectura. */
export function ExpensesTable({
  expenses,
  canWrite,
}: {
  expenses: Expense[];
  /** purchases:write — sin él no se renderizan editar/borrar. */
  canWrite: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proveedor</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Centro de costo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Fuente</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow
            key={expense.id}
            className={cn(expense.status === "void" && "opacity-50")}
          >
            <TableCell className="max-w-56 truncate text-sm font-medium">
              {expense.providerName}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {expense.txnDate}
            </TableCell>
            <TableCell className="text-sm">
              {expense.costCenter ?? (
                <span className="text-health-warn">Sin asignar</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {STATUS_LABELS[expense.status]}
              {expense.kind === "bill" && expense.dueDate && (
                <span className="ml-1 text-xs text-muted-foreground">
                  · vence {expense.dueDate}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatCurrency(expense.total, expense.currencyCode)}
            </TableCell>
            <TableCell>
              <SourceBadge source={expense.source} />
            </TableCell>
            <TableCell className="text-right">
              {canWrite && expense.source === "manual" && (
                <span className="inline-flex items-center gap-1">
                  <ExpenseForm expense={expense} />
                  <DeleteRecordButton
                    action={deleteExpense}
                    id={expense.id}
                    title={`¿Borrar el gasto de ${expense.providerName} del ${expense.txnDate}?`}
                    body="Se borra el registro y deja de contar en gastos y cuentas por pagar. Esta acción no se puede deshacer."
                    confirmLabel="Borrar gasto"
                    successMessage={`Gasto de ${expense.providerName} borrado`}
                  />
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
