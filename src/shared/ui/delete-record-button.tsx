"use client";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/shared/actions/result";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type DeleteRecordButtonProps = {
  /** Server action de borrado (referencia serializable). */
  action: (id: string) => Promise<ActionResult<unknown>>;
  id: string;
  /** Con el objeto concreto: "¿Borrar la factura FV-2041?". */
  title: string;
  /** La consecuencia real. */
  body?: string;
  /** Verbo + objeto del botón rojo: "Borrar factura". */
  confirmLabel: string;
  successMessage: string;
  /** El objeto en peligro, nombrado en el lomo ("FV-2041"). */
  objectName?: string;
};

/** Borrado de registros manuales con la confirmación destructiva (§12.4). */
export function DeleteRecordButton({
  action,
  id,
  title,
  body = "Esta acción no se puede deshacer.",
  confirmLabel,
  successMessage,
  objectName,
}: DeleteRecordButtonProps) {
  const { submit, pending } = useActionSubmit<unknown>();
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
        >
          Borrar
        </Button>
      }
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      objectName={objectName}
      pending={pending}
      onConfirm={() => submit(() => action(id), { successMessage })}
    />
  );
}
