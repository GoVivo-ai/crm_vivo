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
import { createProposal } from "@/modules/crm/application/activities-actions";
import type { Proposal, ProposalStatus } from "@/modules/crm/domain/types";
import { PROPOSAL_STATUS_LABELS } from "@/modules/crm/ui/labels";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

export function ProposalForm({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Proposal>();

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
          status: form.get("status"),
          amount: rawAmount === "" ? null : Number(rawAmount),
        }),
      {
        successMessage: "Propuesta guardada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Nueva propuesta
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva propuesta</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
              <Label htmlFor="status">Estado</Label>
              <NativeSelect id="status" name="status" defaultValue="draft">
                {(
                  Object.entries(PROPOSAL_STATUS_LABELS) as [
                    ProposalStatus,
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
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar propuesta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
