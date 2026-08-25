"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  convertDealToClient,
  type ConvertDealResult,
} from "@/modules/clients/application/convert-deal-to-client";
import type { Service } from "@/modules/clients/domain/types";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureDialogHeader,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type ConvertDealDialogProps = {
  dealId: string;
  catalog: Service[];
  today: string; // YYYY-MM-DD
};

/**
 * Cierre ganado: mueve el deal a la etapa ganada, activa la cuenta como
 * cliente y contrata los servicios marcados. Caso de uso de backend.
 */
export function ConvertDealDialog({
  dealId,
  catalog,
  today,
}: ConvertDealDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { submit, pending } = useActionSubmit<ConvertDealResult>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { selected },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const services = catalog
      .filter((s) => selected[s.id])
      .map((s) => ({
        serviceId: s.id,
        monthlyFee: Number(form.get(`fee-${s.id}`) ?? 0),
        startDate: today,
      }));
    submit(() => convertDealToClient({ dealId, services }), {
      successMessage: "Deal ganado: la cuenta ya es cliente",
      onSuccess: (data) => {
        setOpen(false);
        router.push(`/clients/${data.accountId}`);
      },
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button size="sm" />}>Marcar ganado</DialogTrigger>
        <CaptureDialogContent>
          <CaptureDialogHeader
            icon={Trophy}
            tint="green"
            title="Convertir en cliente"
            subtitle="Cierre ganado · CRM"
          />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <p className="text-sm text-muted-foreground">
                El deal pasa a la etapa ganada y la cuenta queda activa como
                cliente. Marca los servicios que se contratan desde hoy
                (puedes agregarlos después en la vista 360).
              </p>
              {catalog.length > 0 && (
                <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                  {catalog.map((service) => (
                    <li key={service.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`svc-${service.id}`}
                        checked={selected[service.id] ?? false}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [service.id]: e.target.checked,
                          }))
                        }
                        className="size-4 accent-[#069B66]"
                      />
                      <label
                        htmlFor={`svc-${service.id}`}
                        className="flex-1 text-sm"
                      >
                        {service.name}
                      </label>
                      {selected[service.id] && (
                        <Input
                          name={`fee-${service.id}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          defaultValue={service.defaultMonthlyFee ?? ""}
                          className="w-32"
                          aria-label={`Fee mensual de ${service.name}`}
                          required
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Confirmar cierre ganado"
              pending={pending}
            />
          </form>
        </CaptureDialogContent>
      </Dialog>
      <DiscardGuardDialog
        open={guard.discardOpen}
        onOpenChange={guard.setDiscardOpen}
        onDiscard={guard.discard}
      />
    </>
  );
}
