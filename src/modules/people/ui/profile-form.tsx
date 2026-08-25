"use client";

import { IdCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createEmployee,
  getEmployeeDetail,
  updateEmployee,
} from "@/modules/people/application/team-actions";
import type {
  EmployeeDetail,
  TeamMember,
} from "@/modules/people/domain/types";
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
 * Alta/edición de empleado (people_directory:write). La PII (cédula,
 * notas) se carga on-demand con getEmployeeDetail al editar.
 */
export function EmployeeForm({ member }: { member?: TeamMember }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const editing = member !== undefined;
  const ready = !editing || detail !== null;
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef });

  useEffect(() => {
    if (!open || !editing || detail) return;
    getEmployeeDetail(member.id).then((result) => {
      if (result.ok) setDetail(result.data);
      else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }, [open, editing, detail, member]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      fullName: form.get("fullName"),
      identification: (form.get("identification") as string) || null,
      email: (form.get("email") as string) || null,
      phone: (form.get("phone") as string) || null,
      hiredAt: (form.get("hiredAt") as string) || null,
      position: (form.get("position") as string) || null,
      area: (form.get("area") as string) || null,
      active: form.get("active") === "on",
      contractType: (form.get("contractType") as string) || null,
      contractEndDate: (form.get("contractEndDate") as string) || null,
      annualLeaveDays: Number(form.get("annualLeaveDays") || 15),
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () => (editing ? updateEmployee(member.id, input) : createEmployee(input)),
      {
        successMessage: editing ? "Empleado actualizado" : "Empleado creado",
        onSuccess: () => {
          setDetail(null);
          setOpen(false);
        },
      },
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
      <DialogTrigger
        render={<Button variant={editing ? "outline" : "default"} size="sm" />}
      >
        {editing ? "Editar" : "+ Nuevo empleado"}
      </DialogTrigger>
      <CaptureDialogContent className="max-h-[85vh] overflow-y-auto">
        <CaptureLomo icon={IdCard} module="Equipo" title={editing ? `Editar · ${member.fullName}` : "Nuevo empleado"} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Directorio · Equipo" />
        {!ready ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cargando expediente…
          </p>
        ) : (
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
            <div className="grid grid-cols-2 gap-3">
              <Field id="fullName" label="Nombre completo" errors={fieldErrors.fullName}>
                <Input id="fullName" name="fullName" defaultValue={member?.fullName ?? ""} required />
              </Field>
              <Field id="identification" label="Identificación" errors={fieldErrors.identification}>
                <Input id="identification" name="identification" defaultValue={detail?.identification ?? ""} />
              </Field>
              <Field id="email" label="Email" errors={fieldErrors.email}>
                <Input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
              </Field>
              <Field id="phone" label="Teléfono" errors={fieldErrors.phone}>
                <Input id="phone" name="phone" defaultValue={member?.phone ?? ""} />
              </Field>
              <Field id="position" label="Cargo" errors={fieldErrors.position}>
                <Input id="position" name="position" defaultValue={member?.position ?? ""} />
              </Field>
              <Field id="area" label="Área" errors={fieldErrors.area}>
                <Input id="area" name="area" defaultValue={member?.area ?? ""} />
              </Field>
              <Field id="hiredAt" label="Ingreso" errors={fieldErrors.hiredAt}>
                <Input id="hiredAt" name="hiredAt" type="date" defaultValue={member?.hiredAt ?? ""} />
              </Field>
              <Field id="contractType" label="Tipo de contrato">
                <Input id="contractType" name="contractType" defaultValue={member?.contractType ?? ""} />
              </Field>
              <Field id="contractEndDate" label="Contrato vence" errors={fieldErrors.contractEndDate}>
                <Input id="contractEndDate" name="contractEndDate" type="date" defaultValue={member?.contractEndDate ?? ""} />
              </Field>
              <Field id="annualLeaveDays" label="Días de vacaciones/año" errors={fieldErrors.annualLeaveDays}>
                <Input id="annualLeaveDays" name="annualLeaveDays" type="number" min="0" max="60" defaultValue={member?.annualLeaveDays ?? 15} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={member?.active ?? true}
                className="size-4 accent-[var(--module-crm)]"
              />
              Activo
            </label>
            <Field id="notes" label="Notas">
              <Textarea id="notes" name="notes" rows={2} defaultValue={detail?.notes ?? ""} />
            </Field>
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Guardar empleado"
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
