"use client";

import { ArrowLeftRight } from "lucide-react";
import { useRef, useState } from "react";
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
import { createBankTransaction } from "@/modules/treasury/application/treasury-actions";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { Segmented } from "@/shared/ui/segmented";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

/** Registro rápido de movimiento bancario (entrada/salida). */
export function TransactionForm({ accounts }: { accounts: Option[] }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const today = new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);
  const keepOpenRef = useRef(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        createBankTransaction({
          bankAccountId: form.get("bankAccountId"),
          date: form.get("date"),
          amount: Number(form.get("amount")),
          direction,
          description: (form.get("description") as string) || null,
        }),
      {
        successMessage: "Movimiento registrado",
        onSuccess: () => {
          if (keepOpenRef.current) {
            keepOpenRef.current = false;
            formRef.current?.reset();
          } else {
            setOpen(false);
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>+ Movimiento</DialogTrigger>
      <CaptureDialogContent>
        <CaptureDialogHeader
          icon={ArrowLeftRight}
          tint="neutral"
          title="Registrar movimiento"
          subtitle="Bancos · Tesorería"
        />
        {accounts.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Crea primero una cuenta bancaria.
          </p>
        ) : (
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
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
                <Label>Tipo</Label>
                <Segmented
                  ariaLabel="Dirección del movimiento"
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { value: "in", label: "Entrada" },
                    { value: "out", label: "Salida" },
                  ]}
                />
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
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Registrar movimiento"
              pending={pending}
              onSaveAnother={() => {
                keepOpenRef.current = true;
                formRef.current?.requestSubmit();
              }}
            />
          </form>
        )}
      </CaptureDialogContent>
    </Dialog>
  );
}
