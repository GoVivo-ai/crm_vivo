"use client";

import { IdCard } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployee } from "@/modules/people/application/team-actions";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

function Field({
  id,
  label,
  errors,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError errors={errors} />
    </div>
  );
}

/**
 * ALTA de empleado (people_directory:write) — datos mínimos del
 * directorio. Todo lo demás (contractual, personal, dotación, notas)
 * se completa POR SECCIÓN en el expediente /people/[id] (§14).
 */
export function EmployeeForm() {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createEmployee({
          fullName: form.get("fullName"),
          email: (form.get("email") as string) || null,
          phone: (form.get("phone") as string) || null,
          hiredAt: (form.get("hiredAt") as string) || null,
          position: (form.get("position") as string) || null,
          area: (form.get("area") as string) || null,
          active: true,
          annualLeaveDays: Number(form.get("annualLeaveDays") || 15),
        }),
      {
        successMessage: "Empleado creado — completa su expediente",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button size="sm" />}>
          + Nuevo empleado
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo
            icon={IdCard}
            module="Equipo"
            title="Nuevo empleado"
            tone="team"
          />
          <div className="flex min-w-0 flex-col">
            <CaptureDialogBar subtitle="Directorio · Equipo" />
            <form ref={formRef} onSubmit={onSubmit}>
              <CaptureDialogBody>
                <Field
                  id="fullName"
                  label="Nombre completo"
                  errors={fieldErrors.fullName}
                >
                  <Input id="fullName" name="fullName" required />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="email" label="Correo" errors={fieldErrors.email}>
                    <Input id="email" name="email" type="email" />
                  </Field>
                  <Field id="phone" label="Teléfono" errors={fieldErrors.phone}>
                    <Input id="phone" name="phone" />
                  </Field>
                  <Field id="position" label="Cargo" errors={fieldErrors.position}>
                    <Input id="position" name="position" />
                  </Field>
                  <Field id="area" label="Área" errors={fieldErrors.area}>
                    <Input id="area" name="area" />
                  </Field>
                  <Field id="hiredAt" label="Ingreso" errors={fieldErrors.hiredAt}>
                    <Input id="hiredAt" name="hiredAt" type="date" />
                  </Field>
                  <Field
                    id="annualLeaveDays"
                    label="Días de vacaciones/año"
                    errors={fieldErrors.annualLeaveDays}
                  >
                    <Input
                      id="annualLeaveDays"
                      name="annualLeaveDays"
                      type="number"
                      min="0"
                      max="60"
                      defaultValue={15}
                    />
                  </Field>
                </div>
              </CaptureDialogBody>
              <CaptureDialogFooter submitLabel="Crear empleado" pending={pending} />
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
