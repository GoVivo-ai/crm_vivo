"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteInvoice } from "@/modules/finance/application/invoices-actions";
import type { Invoice } from "@/modules/finance/domain/types";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { RowMenu } from "@/shared/ui/entity/row-menu";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Menú ⋯ de la fila de factura (§15.2): Editar/Borrar como Lomos. */
export function InvoiceRowActions({
  invoice,
  accounts,
}: {
  invoice: Invoice;
  accounts: { id: string; name: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { submit, pending } = useActionSubmit<unknown>();
  const name = invoice.number ?? invoice.accountName ?? "la factura";

  return (
    <>
      <RowMenu label={name}>
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
        <InvoiceForm
          invoice={invoice}
          accounts={accounts}
          open={editOpen}
          onOpenChange={setEditOpen}
          hideTrigger
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`¿Borrar la factura ${invoice.number ?? "sin número"} de ${invoice.accountName ?? invoice.clientName ?? "?"}?`}
        body="Se borra el registro y deja de contar en facturación y cartera. Esta acción no se puede deshacer."
        confirmLabel="Borrar factura"
        objectName={invoice.number ?? invoice.accountName ?? undefined}
        pending={pending}
        onConfirm={() =>
          submit(() => deleteInvoice(invoice.id), {
            successMessage: `Factura ${invoice.number ?? ""} borrada`.trim(),
          })
        }
      />
    </>
  );
}
