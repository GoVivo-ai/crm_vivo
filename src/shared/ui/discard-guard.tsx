"use client";

import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

/** Dialog "¿Descartar cambios?" del guard (§12.4, controlado). */
export function DiscardGuardDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Descartar cambios?"
      body="Lo que escribiste en este formulario se perderá."
      confirmLabel="Descartar cambios"
      cancelLabel="Seguir editando"
      eyebrow="Sin guardar"
      onConfirm={onDiscard}
    />
  );
}
