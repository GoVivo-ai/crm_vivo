"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStaffing,
  deleteStaffing,
} from "@/modules/profitability/application/staffing-actions";
import type { StaffingAssignment } from "@/modules/profitability/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

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
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createStaffing({
          accountId: form.get("accountId"),
          alegraEmployeeId: form.get("alegraEmployeeId"),
          dedicationPercent: Number(form.get("dedicationPercent")),
          validFrom: (form.get("validFrom") as string) || null,
          validTo: (form.get("validTo") as string) || null,
        }),
      { successMessage: "Asignación creada", onSuccess: () => setOpen(false) },
    );
  }

  function onDelete(assignment: StaffingAssignment) {
    if (
      !window.confirm(
        `¿Eliminar la asignación de ${assignment.employeeName ?? "?"} en ${assignment.accountName ?? "?"}?`,
      )
    )
      return;
    submit(() => deleteStaffing(assignment.id), {
      successMessage: "Asignación eliminada",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Nueva asignación</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar persona a cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="alegraEmployeeId">Persona</Label>
                <NativeSelect id="alegraEmployeeId" name="alegraEmployeeId" required>
                  <option value="">Elige…</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={fieldErrors.alegraEmployeeId} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="accountId">Cliente</Label>
                <NativeSelect id="accountId" name="accountId" required>
                  <option value="">Elige…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </NativeSelect>
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
              <Button type="submit" disabled={pending}>
                {pending ? "Creando…" : "Crear asignación"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(a)}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
