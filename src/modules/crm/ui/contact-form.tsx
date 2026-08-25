"use client";

import { UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createContact,
  updateContact,
} from "@/modules/crm/application/contacts-actions";
import type { Contact } from "@/modules/crm/domain/types";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureDialogHeader,
} from "@/shared/ui/capture-dialog";
import { Combobox } from "@/shared/ui/combobox";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type AccountOption = { id: string; name: string };

type ContactFormProps = {
  /** Con contact = modo edición; sin él, creación. */
  contact?: Contact;
  accounts: AccountOption[];
  triggerLabel: string;
};

export function ContactForm({
  contact,
  accounts,
  triggerLabel,
}: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(
    contact?.accountId ?? null,
  );
  const { submit, pending, fieldErrors } = useActionSubmit<Contact>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { accountId },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: form.get("name"),
      email: (form.get("email") as string) || null,
      phone: (form.get("phone") as string) || null,
      jobTitle: (form.get("jobTitle") as string) || null,
      accountId,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () =>
        contact ? updateContact(contact.id, input) : createContact(input),
      {
        successMessage: contact
          ? `Contacto ${form.get("name")} actualizado`
          : `Contacto ${form.get("name")} creado`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger
          render={<Button variant={contact ? "outline" : "default"} size="sm" />}
        >
          {triggerLabel}
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureDialogHeader
            icon={UserRound}
            tint="green"
            title={contact ? "Editar contacto" : "Nuevo contacto"}
            subtitle="Personas · CRM"
          />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" defaultValue={contact?.name} required />
                <FieldError errors={fieldErrors.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={contact?.email ?? ""}
                  />
                  <FieldError errors={fieldErrors.email} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
                  <FieldError errors={fieldErrors.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jobTitle">Cargo</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    defaultValue={contact?.jobTitle ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Cuenta</Label>
                  <Combobox
                    ariaLabel="Cuenta del contacto"
                    options={accounts}
                    value={accountId}
                    onValueChange={setAccountId}
                    placeholder="Buscar cuenta…"
                  />
                  <FieldError errors={fieldErrors.accountId} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={contact?.notes ?? ""}
                />
              </div>
            </CaptureDialogBody>
            <CaptureDialogFooter submitLabel="Guardar contacto" pending={pending} />
          </form>
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
