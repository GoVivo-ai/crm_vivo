"use client";

import { CalendarOff } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLeaveRequest } from "@/modules/people/application/leave-actions";
import type { LeaveType } from "@/modules/people/domain/types";
import { LEAVE_TYPE_LABELS } from "@/modules/people/ui/labels";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureDialogHeader,
} from "@/shared/ui/capture-dialog";
import { Combobox } from "@/shared/ui/combobox";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

const TYPE_OPTIONS = (
  Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]
).map(([id, name]) => ({ id, name }));

/** Solicitud de ausencia — el solicitante sale de la sesión, no se envía. */
export function LeaveRequestForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string | null>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef, extraState: { type } });

  // Estimación L–V en cliente; el conteo definitivo (con festivos de
  // Colombia) lo hace el server al enviar — la banda lo dice.
  const weekdays = (() => {
    if (!startDate || !endDate || startDate > endDate) return null;
    let count = 0;
    for (
      let t = Date.parse(startDate);
      t <= Date.parse(endDate);
      t += 86_400_000
    ) {
      const dow = new Date(t).getUTCDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    return count;
  })();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createLeaveRequest({
          type,
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
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button size="sm" />}>Pedir ausencia</DialogTrigger>
        <CaptureDialogContent>
          <CaptureDialogHeader
            icon={CalendarOff}
            tint="navy"
            title="Nueva solicitud"
            subtitle="Ausencias · Equipo"
          />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Combobox
                  ariaLabel="Tipo de ausencia"
                  options={TYPE_OPTIONS}
                  value={type}
                  onValueChange={setType}
                  required
                />
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
              {weekdays !== null && (
                // Banda verde del spec: días en vivo (L–V; festivos al enviar).
                <div
                  aria-live="polite"
                  className="rounded-lg bg-[#E6F9F1] px-3.5 py-2.5 text-[13px] font-extrabold text-[#069B66]"
                >
                  {weekdays} día{weekdays === 1 ? "" : "s"} L–V
                  <span className="ml-1.5 font-semibold text-[#069B66]/70">
                    · los festivos se descuentan al enviar
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea id="reason" name="reason" rows={2} />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                La aprueba gerencia o administración — nunca quien la solicita.
              </p>
            </CaptureDialogBody>
            <CaptureDialogFooter submitLabel="Enviar solicitud" pending={pending} />
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
