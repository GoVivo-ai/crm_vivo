"use client";

import { HandCoins } from "lucide-react";
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
import { createPayrollPayment } from "@/modules/people/application/team-actions";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

/** Registro de pago de nómina (people_compensation:write). */
export function PayrollPaymentForm({ employees }: { employees: Option[] }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("COP");
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const today = new Date().toISOString().slice(0, 10);
  const currentPeriod = today.slice(0, 7);
  const formRef = useRef<HTMLFormElement>(null);
  const keepOpenRef = useRef(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    submit(
      () =>
        createPayrollPayment({
          employeeId: form.get("employeeId"),
          period: form.get("period"),
          amount: Number(form.get("amount")),
          currencyCode: currency,
          exchangeRate: rawRate ? Number(rawRate) : null,
          paidAt: form.get("paidAt"),
          notes: (form.get("notes") as string) || null,
        }),
      {
        successMessage: "Pago de nómina registrado",
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
      <DialogTrigger render={<Button size="sm" />}>+ Pago de nómina</DialogTrigger>
      <CaptureDialogContent>
        <CaptureDialogHeader
          icon={HandCoins}
          tint="gold"
          title="Registrar pago de nómina"
          subtitle="Compensación · Equipo"
        />
        {employees.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Crea primero a las personas en el directorio.
          </p>
        ) : (
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employeeId">Persona</Label>
              <NativeSelect id="employeeId" name="employeeId" required>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.employeeId} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="period">Periodo</Label>
                <Input
                  id="period"
                  name="period"
                  type="month"
                  defaultValue={currentPeriod}
                  required
                />
                <FieldError errors={fieldErrors.period} />
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
                <Label htmlFor="paidAt">Pagado el</Label>
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  defaultValue={today}
                  required
                />
                <FieldError errors={fieldErrors.paidAt} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyFields
                currency={currency}
                onCurrencyChange={setCurrency}
                exchangeRateErrors={fieldErrors.exchangeRate}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Nota</Label>
                <Input id="notes" name="notes" />
              </div>
            </div>
            </CaptureDialogBody>
            <CaptureDialogFooter
              submitLabel="Registrar pago"
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
