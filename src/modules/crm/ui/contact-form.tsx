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
  createContact,
  updateContact,
} from "@/modules/crm/application/contacts-actions";
import type { Contact } from "@/modules/crm/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

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
  const { submit, pending, fieldErrors } = useActionSubmit<Contact>();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: form.get("name"),
      email: (form.get("email") as string) || null,
      phone: (form.get("phone") as string) || null,
      jobTitle: (form.get("jobTitle") as string) || null,
      accountId: (form.get("accountId") as string) || null,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () =>
        contact ? updateContact(contact.id, input) : createContact(input),
      {
        successMessage: contact ? "Contacto actualizado" : "Contacto creado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={contact ? "outline" : "default"} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Editar contacto" : "Nuevo contacto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jobTitle">Cargo</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              defaultValue={contact?.jobTitle ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountId">Cuenta</Label>
            <NativeSelect
              id="accountId"
              name="accountId"
              defaultValue={contact?.accountId ?? ""}
            >
              <option value="">Sin cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={fieldErrors.accountId} />
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
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar contacto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
