"use client";

import { IdCard } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { updateEmployee } from "@/modules/people/application/team-actions";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import type { EmployeeInput } from "@/modules/people/domain/validation";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";
import { toEmployeeInput } from "./helpers";

/**
 * Lomo de sección del expediente (§14): edita SOLO los campos de su
 * card. Parte del input completo del detalle y pisa únicamente lo que
 * `collect` devuelve — jamás un formulario plano de 30 campos.
 */
export function SectionLomo({
  detail,
  title,
  triggerLabel = "Editar sección →",
  collect,
  children,
}: {
  detail: EmployeeDetail;
  /** Título corto del lomo: "Contractual". */
  title: string;
  triggerLabel?: string;
  /** FormData → campos de ESTA sección (se mezclan sobre el detalle). */
  collect: (form: FormData) => Partial<EmployeeInput>;
  /** Campos del formulario. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { submit, pending } = useActionSubmit<unknown>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const patch = collect(new FormData(event.currentTarget));
    submit(
      () => updateEmployee(detail.id, { ...toEmployeeInput(detail), ...patch }),
      {
        successMessage: "Sección actualizada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="ml-auto text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
            />
          }
        >
          {triggerLabel}
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo
            icon={IdCard}
            module="Equipo"
            title={title}
            tone="team"
            context={{ entity: detail.fullName }}
          />
          <div className="flex min-w-0 flex-col">
            <CaptureDialogBar subtitle={`Expediente · ${detail.fullName}`} />
            <form ref={formRef} onSubmit={onSubmit}>
              <CaptureDialogBody>{children}</CaptureDialogBody>
              <CaptureDialogFooter
                submitLabel="Guardar sección"
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
