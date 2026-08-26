"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteExpense } from "@/modules/purchases/application/purchases-actions";
import type { Expense } from "@/modules/purchases/domain/types";
import { ExpenseForm } from "@/modules/purchases/ui/expense-form";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { RowMenu } from "@/shared/ui/entity/row-menu";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Menú ⋯ de la fila de gasto (§15.2). */
export function ExpenseRowActions({ expense }: { expense: Expense }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { submit, pending } = useActionSubmit<unknown>();

  return (
    <>
      <RowMenu label={expense.providerName}>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Borrar
        </DropdownMenuItem>
      </RowMenu>
      {editOpen && (
        <ExpenseForm
          expense={expense}
          open={editOpen}
          onOpenChange={setEditOpen}
          hideTrigger
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`¿Borrar el gasto de ${expense.providerName} del ${expense.txnDate}?`}
        body="Se borra el registro y deja de contar en gastos y cuentas por pagar. Esta acción no se puede deshacer."
        confirmLabel="Borrar gasto"
        objectName={expense.providerName}
        pending={pending}
        onConfirm={() =>
          submit(() => deleteExpense(expense.id), {
            successMessage: `Gasto de ${expense.providerName} borrado`,
          })
        }
      />
    </>
  );
}
