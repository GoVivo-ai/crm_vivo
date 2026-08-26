"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteBankTransaction } from "@/modules/treasury/application/treasury-actions";
import type { BankTransactionView } from "@/modules/treasury/domain/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { RowMenu } from "@/shared/ui/entity/row-menu";
import { formatMoney } from "@/shared/ui/format";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Menú ⋯ de la fila de movimiento (§15.2). */
export function TransactionRowActions({ tx }: { tx: BankTransactionView }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { submit, pending } = useActionSubmit<unknown>();

  return (
    <>
      <RowMenu label={`movimiento del ${tx.date}`}>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Borrar
        </DropdownMenuItem>
      </RowMenu>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`¿Borrar el movimiento del ${tx.date} por ${formatMoney(tx.amount)}?`}
        body="Deja de contar en el flujo de caja del mes. Esta acción no se puede deshacer."
        confirmLabel="Borrar movimiento"
        objectName={tx.bankName ?? undefined}
        pending={pending}
        onConfirm={() =>
          submit(() => deleteBankTransaction(tx.id), {
            successMessage: "Movimiento borrado",
          })
        }
      />
    </>
  );
}
