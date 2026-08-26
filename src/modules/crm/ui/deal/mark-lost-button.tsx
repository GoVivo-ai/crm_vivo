"use client";

import { Button } from "@/components/ui/button";
import { moveDealToStage } from "@/modules/crm/application/deals-actions";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Acción destructiva de la cabecera (§15.1): mover a la etapa perdida
 * con confirmación de lomo rojo — nunca un clic directo. */
export function MarkLostButton({
  dealId,
  dealTitle,
  lostStageId,
  nextPosition,
}: {
  dealId: string;
  dealTitle: string;
  lostStageId: string;
  nextPosition: number;
}) {
  const { submit, pending } = useActionSubmit<unknown>();
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          className="text-[#C93A3A] hover:text-[#B53232]"
        >
          Perdido
        </Button>
      }
      title={`¿Marcar "${dealTitle}" como perdido?`}
      body="El negocio sale del pipeline abierto y deja de sumar al forecast. Puede reabrirse moviéndolo a una etapa abierta."
      confirmLabel="Marcar perdido"
      eyebrow="Se pierde"
      objectName={dealTitle}
      pending={pending}
      onConfirm={() =>
        submit(
          () =>
            moveDealToStage({
              dealId,
              stageId: lostStageId,
              position: nextPosition,
            }),
          { successMessage: "Negocio marcado como perdido" },
        )
      }
    />
  );
}
