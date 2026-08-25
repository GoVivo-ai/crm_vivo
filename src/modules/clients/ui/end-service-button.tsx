"use client";

import { Button } from "@/components/ui/button";
import { endServiceForAccount } from "@/modules/clients/application/services-actions";
import type { AccountService } from "@/modules/clients/domain/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type EndServiceButtonProps = {
  accountServiceId: string;
  serviceName: string;
  today: string; // YYYY-MM-DD
};

/** Finaliza un servicio contratado con fecha de hoy (sale del MRR). */
export function EndServiceButton({
  accountServiceId,
  serviceName,
  today,
}: EndServiceButtonProps) {
  const { submit, pending } = useActionSubmit<AccountService>();

  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
        >
          Finalizar
        </Button>
      }
      title={`¿Finalizar "${serviceName}" hoy?`}
      body="El servicio deja de sumar al MRR desde hoy; el histórico se conserva."
      confirmLabel="Finalizar servicio"
      objectName={serviceName}
      pending={pending}
      onConfirm={() =>
        submit(
          () => endServiceForAccount({ accountServiceId, endDate: today }),
          { successMessage: `Servicio ${serviceName} finalizado` },
        )
      }
    />
  );
}
