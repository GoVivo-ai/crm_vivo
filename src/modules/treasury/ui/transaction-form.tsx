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
import { createBankTransaction } from "@/modules/treasury/application/treasury-actions";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

/** Registro rápido de movimiento bancario (entrada/salida). */
export function TransactionForm({ accounts }: { accounts: Option[] }) {
  const [open, setOpen] = useState(false);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createBankTransaction({
          bankAccountId: form.get("bankAccountId"),
          date: form.get("date"),
          amount: Number(form.get("amount")),
          direction: form.get("direction"),
          description: (form.get("description") as string) || null,
        }),
      {
        successMessage: "Movimiento registrado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>+ Movimiento</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Crea primero una cuenta bancaria.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankAccountId">Cuenta</Label>
              <NativeSelect id="bankAccountId" name="bankAccountId" required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.bankAccountId} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="direction">Tipo</Label>
                <NativeSelect id="direction" name="direction" defaultValue="in">
                  <option value="in">Entrada</option>
                  <option value="out">Salida</option>
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  required
                />
                <FieldError errors={fieldErrors.amount} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                />
                <FieldError errors={fieldErrors.date} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                placeholder="Pago cliente X, nómina agosto…"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando…" : "Registrar"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
