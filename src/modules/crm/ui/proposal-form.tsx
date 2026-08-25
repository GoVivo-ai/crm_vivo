"use client";

import { FileSpreadsheet } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProposal } from "@/modules/crm/application/activities-actions";
import type { Proposal, ProposalStatus } from "@/modules/crm/domain/types";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

export function ProposalForm({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ProposalStatus>("draft");
  const { submit, pending, fieldErrors } = useActionSubmit<Proposal>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { status },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawAmount = form.get("amount") as string;
    submit(
      () =>
        createProposal({
          dealId,
          title: form.get("title"),
          url: (form.get("url") as string) || null,
          status,
          amount: rawAmount === "" ? null : Number(rawAmount),
        }),
      {
        successMessage: `Propuesta "${form.get("title")}" guardada`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  const lomoContext = undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Nueva propuesta
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo icon={FileSpreadsheet} module="CRM" title={"Nueva propuesta"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Comercial · CRM" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required />
                <FieldError errors={fieldErrors.title} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="url">Enlace (Drive, Notion, PDF…)</Label>
                <Input id="url" name="url" type="url" placeholder="https://…" />
                <FieldError errors={fieldErrors.url} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Estado</Label>
                  <Segmented
                    ariaLabel="Estado de la propuesta"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "draft", label: "Borrador" },
                      { value: "sent", label: "Enviada" },
                      { value: "accepted", label: "Aceptada" },
                      { value: "rejected", label: "Rechazada" },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Monto (COP)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                  <FieldError errors={fieldErrors.amount} />
                </div>
              </div>
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Guardar propuesta"
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
