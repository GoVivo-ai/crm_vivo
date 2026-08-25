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
import { createProject } from "@/modules/clients/application/projects-actions";
import type { Project } from "@/modules/clients/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

export function ProjectForm({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Project>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createProject({
          accountId,
          name: form.get("name"),
          clickupListId: (form.get("clickupListId") as string) || null,
          startDate: (form.get("startDate") as string) || null,
        }),
      {
        successMessage: "Proyecto creado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
            <FieldError errors={fieldErrors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clickupListId">Lista de ClickUp (id)</Label>
              <Input
                id="clickupListId"
                name="clickupListId"
                placeholder="Opcional, habilita el sync"
              />
              <FieldError errors={fieldErrors.clickupListId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" name="startDate" type="date" />
              <FieldError errors={fieldErrors.startDate} />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear proyecto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
