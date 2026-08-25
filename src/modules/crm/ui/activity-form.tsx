"use client";

import { NotebookPen } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createActivity } from "@/modules/crm/application/activities-actions";
import type { Activity, ActivityType } from "@/modules/crm/domain/types";
import { ACTIVITY_TYPE_LABELS } from "@/modules/crm/ui/labels";
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

const TYPE_OPTIONS = (
  Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]
).map(([id, name]) => ({ id, name }));

export function ActivityForm({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string | null>("call");
  const { submit, pending, fieldErrors } = useActionSubmit<Activity>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef, extraState: { type } });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createActivity({
          type,
          subject: form.get("subject"),
          content: (form.get("content") as string) || null,
          dueDate: (form.get("dueDate") as string) || null,
          dealId,
        }),
      {
        successMessage: `Actividad "${form.get("subject")}" registrada`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  const lomoContext = undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Registrar actividad
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo icon={NotebookPen} module="CRM" title={"Nueva actividad"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Seguimiento · CRM" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo</Label>
                  <Combobox
                    ariaLabel="Tipo de actividad"
                    options={TYPE_OPTIONS}
                    value={type}
                    onValueChange={setType}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dueDate">Vence</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                  <FieldError errors={fieldErrors.dueDate} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" name="subject" required />
                <FieldError errors={fieldErrors.subject} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="content">Detalle</Label>
                <Textarea id="content" name="content" rows={3} />
              </div>
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Guardar actividad"
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
