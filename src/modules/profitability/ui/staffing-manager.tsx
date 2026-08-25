"use client";

import { Users } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureDialogHeader,
} from "@/shared/ui/capture-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStaffing,
  deleteStaffing,
} from "@/modules/profitability/application/staffing-actions";
import type { StaffingAssignment } from "@/modules/profitability/domain/types";
import { Combobox } from "@/shared/ui/combobox";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type Option = { id: string; name: string };

type StaffingManagerProps = {
  assignments: StaffingAssignment[];
  accounts: Option[];
  employees: Option[];
};

/** Asignación empleado↔cuenta con % de dedicación (solo admin). */
export function StaffingManager({
  assignments,
  accounts,
  employees,
}: StaffingManagerProps) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { employeeId, accountId },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createStaffing({
          accountId,
          employeeId,
          dedicationPercent: Number(form.get("dedicationPercent")),
          validFrom: (form.get("validFrom") as string) || null,
          validTo: (form.get("validTo") as string) || null,
        }),
      { successMessage: "Asignación creada", onSuccess: () => setOpen(false) },
    );
  }

  function onDelete(assignment: StaffingAssignment) {
    submit(() => deleteStaffing(assignment.id), {
      successMessage: "Asignación eliminada",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
          <DialogTrigger render={<Button size="sm" />}>Nueva asignación</DialogTrigger>
          <CaptureDialogContent>
            <CaptureDialogHeader
              icon={Users}
              tint="gold"
              title="Asignar persona a cliente"
              subtitle="Rentabilidad · Finanzas"
            />
            <form ref={formRef} onSubmit={onSubmit}>
              <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label>Persona</Label>
                <Combobox
                  ariaLabel="Persona a asignar"
                  options={employees}
                  value={employeeId}
                  onValueChange={setEmployeeId}
                  placeholder="Buscar persona…"
                  required
                />
                <FieldError errors={fieldErrors.employeeId} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cliente</Label>
                <Combobox
                  ariaLabel="Cliente destino"
                  options={accounts}
                  value={accountId}
                  onValueChange={setAccountId}
                  placeholder="Buscar cliente…"
                  required
                />
                <FieldError errors={fieldErrors.accountId} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dedicationPercent">% dedicación</Label>
                  <Input
                    id="dedicationPercent"
                    name="dedicationPercent"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue="50"
                    required
                  />
                  <FieldError errors={fieldErrors.dedicationPercent} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="validFrom">Desde</Label>
                  <Input id="validFrom" name="validFrom" type="date" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="validTo">Hasta</Label>
                  <Input id="validTo" name="validTo" type="date" />
                </div>
              </div>
              </CaptureDialogBody>
              <CaptureDialogFooter
                submitLabel="Crear asignación"
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
      </div>

      <ul className="flex flex-col gap-2">
        {assignments.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {a.employeeName ?? "—"} → {a.accountName ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.dedicationPercent}% de dedicación
                {a.validFrom ? ` · desde ${a.validFrom}` : ""}
                {a.validTo ? ` · hasta ${a.validTo}` : ""}
              </p>
            </div>
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Eliminar
                </Button>
              }
              title={`¿Eliminar la asignación de ${a.employeeName ?? "?"} en ${a.accountName ?? "?"}?`}
              body="Su costo dejará de prorratearse a este cliente desde el periodo vigente."
              confirmLabel="Eliminar asignación"
              pending={pending}
              onConfirm={() => onDelete(a)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
