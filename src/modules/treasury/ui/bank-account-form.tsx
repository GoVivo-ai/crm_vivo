"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureDialogHeader,
} from "@/shared/ui/capture-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBankAccount,
  updateBankAccount,
} from "@/modules/treasury/application/treasury-actions";
import type { BankAccountView } from "@/modules/treasury/domain/types";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Alta/edición de cuenta manual — el saldo se actualiza guardando aquí. */
export function BankAccountForm({ account }: { account?: BankAccountView }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(account?.currencyCode ?? "COP");
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const editing = account !== undefined;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    const input = {
      name: form.get("name"),
      type: (form.get("type") as string) || null,
      currencyCode: currency,
      balance: Number(form.get("balance")),
      exchangeRate: rawRate ? Number(rawRate) : null,
      isActive: form.get("isActive") === "on",
    };
    submit(
      () =>
        editing ? updateBankAccount(account.id, input) : createBankAccount(input),
      {
        successMessage: editing ? "Cuenta actualizada" : "Cuenta creada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={editing ? "outline" : "default"} size="sm" />}
      >
        {editing ? "Editar" : "+ Cuenta bancaria"}
      </DialogTrigger>
      <CaptureDialogContent>
        <CaptureDialogHeader
          icon={Landmark}
          tint="neutral"
          title={editing ? `Editar · ${account.name}` : "Nueva cuenta bancaria"}
          subtitle="Bancos · Tesorería"
        />
        <form onSubmit={onSubmit}>
          <CaptureDialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={account?.name} required />
              <FieldError errors={fieldErrors.name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <NativeSelect
                id="type"
                name="type"
                defaultValue={account?.type ?? "bank"}
              >
                <option value="bank">Banco</option>
                <option value="cash">Caja</option>
                <option value="credit-card">Tarjeta de crédito</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balance">Saldo actual</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                inputMode="decimal"
                defaultValue={account?.balance ?? ""}
                required
              />
              <FieldError errors={fieldErrors.balance} />
            </div>
            <CurrencyFields
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRateErrors={fieldErrors.exchangeRate}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={account?.isActive ?? true}
              className="size-4 accent-[var(--module-crm)]"
            />
            Cuenta activa (suma a la posición)
          </label>
          </CaptureDialogBody>
          <CaptureDialogFooter submitLabel="Guardar cuenta" pending={pending} />
        </form>
      </CaptureDialogContent>
    </Dialog>
  );
}
