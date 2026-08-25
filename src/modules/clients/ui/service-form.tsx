"use client";

import { Package } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createService } from "@/modules/clients/application/services-actions";
import type { Service } from "@/modules/clients/domain/types";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

/** Alta en el catálogo de servicios de la agencia. */
export function ServiceForm() {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Service>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawFee = form.get("defaultMonthlyFee") as string;
    submit(
      () =>
        createService({
          name: form.get("name"),
          description: (form.get("description") as string) || null,
          defaultMonthlyFee: rawFee === "" ? null : Number(rawFee),
        }),
      {
        successMessage: `Servicio ${form.get("name")} creado`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  const lomoContext = undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button size="sm" />}>Nuevo servicio</DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo icon={Package} module="Clientes" title={"Nuevo servicio del catálogo"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Servicios · Clientes" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Pauta digital, SEO, desarrollo…"
                  required
                />
                <FieldError errors={fieldErrors.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="defaultMonthlyFee">
                  Fee mensual sugerido (COP)
                </Label>
                <Input
                  id="defaultMonthlyFee"
                  name="defaultMonthlyFee"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
                <FieldError errors={fieldErrors.defaultMonthlyFee} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Guardar servicio"
              pending={pending}
            />
          </form>
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
