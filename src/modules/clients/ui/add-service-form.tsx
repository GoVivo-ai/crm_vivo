"use client";

import { PackagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addServiceToAccount } from "@/modules/clients/application/services-actions";
import type { AccountService, Service } from "@/modules/clients/domain/types";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { Combobox } from "@/shared/ui/combobox";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type AddServiceFormProps = {
  accountId: string;
  catalog: Service[];
  today: string; // YYYY-MM-DD
};

/** Contratar un servicio del catálogo para una cuenta. */
export function AddServiceForm({
  accountId,
  catalog,
  today,
}: AddServiceFormProps) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(
    catalog[0]?.id ?? null,
  );
  const { submit, pending, fieldErrors } = useActionSubmit<AccountService>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { serviceId },
  });

  const selected = catalog.find((s) => s.id === serviceId);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        addServiceToAccount({
          accountId,
          serviceId,
          monthlyFee: Number(form.get("monthlyFee")),
          startDate: form.get("startDate"),
        }),
      {
        successMessage: `Servicio ${selected?.name ?? ""} contratado`.trim(),
        onSuccess: () => setOpen(false),
      },
    );
  }

  const lomoContext = undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Contratar servicio
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo icon={PackagePlus} module="Clientes" title={"Contratar servicio"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Vista 360 · Clientes" />
          {catalog.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              El catálogo está vacío. Crea primero un servicio en Clientes →
              Servicios.
            </p>
          ) : (
            <form ref={formRef} onSubmit={onSubmit}>
              <CaptureDialogBody>
                <div className="flex flex-col gap-1.5">
                  <Label>Servicio</Label>
                  <Combobox
                    ariaLabel="Servicio del catálogo"
                    options={catalog.map(({ id, name }) => ({ id, name }))}
                    value={serviceId}
                    onValueChange={setServiceId}
                    placeholder="Buscar servicio…"
                    required
                  />
                  <FieldError errors={fieldErrors.serviceId} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="monthlyFee">Fee mensual (COP)</Label>
                    <Input
                      id="monthlyFee"
                      name="monthlyFee"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      key={serviceId}
                      defaultValue={selected?.defaultMonthlyFee ?? ""}
                      required
                    />
                    <FieldError errors={fieldErrors.monthlyFee} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="startDate">Desde</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <FieldError errors={fieldErrors.startDate} />
                  </div>
                </div>
              </CaptureDialogBody>
              <CaptureDialogFooter
                submitLabel="Contratar servicio"
                pending={pending}
              />
            </form>
          )}
        </div>
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
