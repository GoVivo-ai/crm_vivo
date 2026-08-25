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
import { createService } from "@/modules/clients/application/services-actions";
import type { Service } from "@/modules/clients/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Alta en el catálogo de servicios de la agencia. */
export function ServiceForm() {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Service>();

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
        successMessage: "Servicio creado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nuevo servicio</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo servicio del catálogo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            <Label htmlFor="defaultMonthlyFee">Fee mensual sugerido (COP)</Label>
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
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar servicio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
