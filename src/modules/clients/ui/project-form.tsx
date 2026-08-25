"use client";

import { FolderKanban } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/modules/clients/application/projects-actions";
import type { Project } from "@/modules/clients/domain/types";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

export function ProjectForm({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Project>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef });

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
        successMessage: `Proyecto ${form.get("name")} creado`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  const lomoContext = undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Nuevo proyecto
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo icon={FolderKanban} module="Clientes" title={"Nuevo proyecto"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Operación · Clientes" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
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
            </CaptureDialogBody>
            <CaptureDialogFooter submitLabel="Crear proyecto" pending={pending} />
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
