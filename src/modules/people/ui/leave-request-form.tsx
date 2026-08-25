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
import { Textarea } from "@/components/ui/textarea";
import { createLeaveRequest } from "@/modules/people/application/leave-actions";
import type { LeaveType } from "@/modules/people/domain/types";
import { LEAVE_TYPE_LABELS } from "@/modules/people/ui/labels";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Solicitud de ausencia — el solicitante sale de la sesión, no se envía. */
export function LeaveRequestForm() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();

  const days =
    startDate && endDate && startDate <= endDate
      ? Math.floor(
          (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000,
        ) + 1
      : null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createLeaveRequest({
          type: form.get("type"),
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          reason: (form.get("reason") as string) || null,
        }),
      {
        successMessage: "Solicitud enviada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Pedir ausencia</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva solicitud</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <NativeSelect id="type" name="type" defaultValue="vacation">
              {(
                Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Desde</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <FieldError errors={fieldErrors.startDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">Hasta</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <FieldError errors={fieldErrors.endDate} />
            </div>
          </div>
          {days !== null && (
            // Banda verde del spec: cálculo de días en vivo.
            <div
              aria-live="polite"
              className="rounded-lg bg-[#E6F9F1] px-3.5 py-2.5 text-[13px] font-extrabold text-[#069B66]"
            >
              {days} día{days === 1 ? "" : "s"} calendario
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea id="reason" name="reason" rows={2} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando…" : "Enviar solicitud"}
          </Button>
          <p className="text-[11px] font-semibold text-muted-foreground">
            La aprueba gerencia o administración — nunca quien la solicita.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
