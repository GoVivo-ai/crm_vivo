"use client";

import { Building2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAccount,
  updateAccount,
} from "@/modules/crm/application/accounts-actions";
import type { Account, AccountStatus } from "@/modules/crm/domain/types";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
  CaptureDialogBar,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type AccountFormProps = {
  account?: Account;
  triggerLabel: string;
};

export function AccountForm({ account, triggerLabel }: AccountFormProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AccountStatus>(
    account?.status ?? "prospect",
  );
  const { submit, pending, fieldErrors } = useActionSubmit<Account>();
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
    const input = {
      name: form.get("name"),
      nit: (form.get("nit") as string) || null,
      industry: (form.get("industry") as string) || null,
      website: (form.get("website") as string) || null,
      status,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () =>
        account ? updateAccount(account.id, input) : createAccount(input),
      {
        successMessage: account
          ? `Cuenta ${form.get("name")} actualizada`
          : `Cuenta ${form.get("name")} creada`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger
          render={<Button variant={account ? "outline" : "default"} size="sm" />}
        >
          {triggerLabel}
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo
            icon={Building2}
            module="CRM"
            title={account ? "Editar cuenta" : "Nueva cuenta"}
          />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Empresas · CRM" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" defaultValue={account?.name} required />
                <FieldError errors={fieldErrors.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Estado</Label>
                <Segmented
                  ariaLabel="Estado de la cuenta"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "prospect", label: "Prospecto" },
                    { value: "active", label: "Activo" },
                    { value: "paused", label: "En pausa" },
                    { value: "churned", label: "Perdido" },
                  ]}
                />
                <FieldError errors={fieldErrors.status} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nit">NIT</Label>
                  <Input id="nit" name="nit" defaultValue={account?.nit ?? ""} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="industry">Industria</Label>
                  <Input
                    id="industry"
                    name="industry"
                    defaultValue={account?.industry ?? ""}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={account?.website ?? ""}
                />
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
            </CaptureDialogBody>
            <CaptureDialogFooter submitLabel="Guardar cuenta" pending={pending} />
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
