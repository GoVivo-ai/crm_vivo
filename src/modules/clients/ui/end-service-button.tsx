"use client";

import { Button } from "@/components/ui/button";
import { endServiceForAccount } from "@/modules/clients/application/services-actions";
import type { AccountService } from "@/modules/clients/domain/types";
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
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm(`¿Finalizar "${serviceName}" con fecha de hoy?`))
          return;
        submit(
          () => endServiceForAccount({ accountServiceId, endDate: today }),
          { successMessage: "Servicio finalizado" },
        );
      }}
    >
      {pending ? "Finalizando…" : "Finalizar"}
    </Button>
  );
}
