"use client";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/shared/actions/result";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type DeleteRecordButtonProps = {
  /** Server action de borrado (referencia serializable). */
  action: (id: string) => Promise<ActionResult<unknown>>;
  id: string;
  confirmText: string;
  successMessage: string;
};

/** Borrado con confirmación para registros manuales. */
export function DeleteRecordButton({
  action,
  id,
  confirmText,
  successMessage,
}: DeleteRecordButtonProps) {
  const { submit, pending } = useActionSubmit<unknown>();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        submit(() => action(id), { successMessage });
      }}
    >
      Borrar
    </Button>
  );
}
