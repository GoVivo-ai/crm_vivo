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
import {
  createAccount,
  updateAccount,
} from "@/modules/crm/application/accounts-actions";
import type { Account, AccountStatus } from "@/modules/crm/domain/types";
import { ACCOUNT_STATUS_LABELS } from "@/modules/crm/ui/labels";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type AccountFormProps = {
  account?: Account;
  triggerLabel: string;
};

export function AccountForm({ account, triggerLabel }: AccountFormProps) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<Account>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: form.get("name"),
      nit: (form.get("nit") as string) || null,
      industry: (form.get("industry") as string) || null,
      website: (form.get("website") as string) || null,
      status: form.get("status"),
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () =>
        account ? updateAccount(account.id, input) : createAccount(input),
      {
        successMessage: account ? "Cuenta actualizada" : "Cuenta creada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={account ? "outline" : "default"} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={account?.name} required />
            <FieldError errors={fieldErrors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nit">NIT</Label>
              <Input id="nit" name="nit" defaultValue={account?.nit ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <NativeSelect
                id="status"
                name="status"
                defaultValue={account?.status ?? "prospect"}
              >
                {(
                  Object.entries(ACCOUNT_STATUS_LABELS) as [
                    AccountStatus,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industria</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={account?.industry ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                name="website"
                defaultValue={account?.website ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={account?.notes ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar cuenta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
