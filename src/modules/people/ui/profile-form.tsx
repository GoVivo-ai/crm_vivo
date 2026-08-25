"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getEmployeeProfileDetail,
  upsertEmployeeProfile,
} from "@/modules/people/application/team-actions";
import type {
  EmployeeProfileDetail,
  TeamMember,
} from "@/modules/people/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/**
 * Expediente del empleado (solo management/admin). La PII (cédula, notas)
 * no viaja en el directorio: se carga al abrir vía getEmployeeProfileDetail.
 */
export function ProfileForm({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<EmployeeProfileDetail | null>(null);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();

  useEffect(() => {
    if (!open || detail) return;
    getEmployeeProfileDetail(member.alegraEmployeeId).then((result) => {
      if (result.ok) {
        setDetail(result.data);
      } else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }, [open, detail, member.alegraEmployeeId]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawDays = form.get("annualLeaveDays") as string;
    submit(
      () =>
        upsertEmployeeProfile({
          alegraEmployeeId: member.alegraEmployeeId,
          position: (form.get("position") as string) || null,
          area: (form.get("area") as string) || null,
          contractType: (form.get("contractType") as string) || null,
          contractEndDate: (form.get("contractEndDate") as string) || null,
          annualLeaveDays: rawDays === "" ? 15 : Number(rawDays),
          notes: (form.get("notes") as string) || null,
        }),
      {
        successMessage: "Expediente guardado",
        onSuccess: () => {
          setDetail(null);
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {member.profile ? "Expediente" : "Crear expediente"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Expediente · {member.fullName}</DialogTitle>
        </DialogHeader>
        {!detail ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cargando expediente…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {detail.identification && (
              <p className="text-xs text-muted-foreground">
                Identificación:{" "}
                <span className="font-mono">{detail.identification}</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  name="position"
                  defaultValue={detail.position ?? member.position ?? ""}
                />
                <FieldError errors={fieldErrors.position} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="area">Área</Label>
                <Input
                  id="area"
                  name="area"
                  defaultValue={detail.area ?? member.area ?? ""}
                />
                <FieldError errors={fieldErrors.area} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contractType">Tipo de contrato</Label>
                <Input
                  id="contractType"
                  name="contractType"
                  placeholder="Prestación, término fijo…"
                  defaultValue={detail.contractType ?? ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contractEndDate">Vence</Label>
                <Input
                  id="contractEndDate"
                  name="contractEndDate"
                  type="date"
                  defaultValue={detail.contractEndDate ?? ""}
                />
                <FieldError errors={fieldErrors.contractEndDate} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="annualLeaveDays">Días de vacaciones al año</Label>
              <Input
                id="annualLeaveDays"
                name="annualLeaveDays"
                type="number"
                min="0"
                max="60"
                defaultValue={detail.annualLeaveDays}
              />
              <FieldError errors={fieldErrors.annualLeaveDays} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={detail.notes ?? ""}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar expediente"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
