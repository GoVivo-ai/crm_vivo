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
import { createActivity } from "@/modules/crm/application/activities-actions";
import type { Activity, ActivityType } from "@/modules/crm/domain/types";
import { ACTIVITY_TYPE_LABELS } from "@/modules/crm/ui/labels";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

export function ActivityForm({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Activity>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createActivity({
          type: form.get("type"),
          subject: form.get("subject"),
          content: (form.get("content") as string) || null,
          dueDate: (form.get("dueDate") as string) || null,
          dealId,
        }),
      {
        successMessage: "Actividad registrada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Registrar actividad
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva actividad</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <NativeSelect id="type" name="type" defaultValue="call">
                {(
                  Object.entries(ACTIVITY_TYPE_LABELS) as [
                    ActivityType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
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
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar actividad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
