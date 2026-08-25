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
import { createDeal } from "@/modules/crm/application/deals-actions";
import type { Deal, PipelineStage } from "@/modules/crm/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

type DealFormProps = {
  accounts: Option[];
  stages: PipelineStage[];
};

export function DealForm({ accounts, stages }: DealFormProps) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Deal>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawAmount = form.get("amount") as string;
    submit(
      () =>
        createDeal({
          title: form.get("title"),
          accountId: form.get("accountId"),
          stageId: form.get("stageId"),
          amount: rawAmount === "" ? null : Number(rawAmount),
          expectedCloseDate:
            (form.get("expectedCloseDate") as string) || null,
        }),
      {
        successMessage: "Deal creado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  const openStages = stages.filter((s) => !s.isWon && !s.isLost);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nuevo deal</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required />
            <FieldError errors={fieldErrors.title} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountId">Cuenta</Label>
            <NativeSelect id="accountId" name="accountId" required>
              <option value="">Elige una cuenta…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={fieldErrors.accountId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stageId">Etapa</Label>
              <NativeSelect id="stageId" name="stageId" required>
                {openStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.stageId} />
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedCloseDate">Cierre esperado</Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
            />
            <FieldError errors={fieldErrors.expectedCloseDate} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear deal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
