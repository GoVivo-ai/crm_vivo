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
import {
  createInvoice,
  updateInvoice,
} from "@/modules/finance/application/invoices-actions";
import type { Invoice } from "@/modules/finance/domain/types";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

type InvoiceFormProps = {
  /** Con invoice = edición (solo registros manuales). */
  invoice?: Invoice;
  /** Cuentas CRM para vincular; puede escribirse un cliente libre. */
  accounts?: Option[];
  triggerLabel?: string;
};

export function InvoiceForm({
  invoice,
  accounts = [],
  triggerLabel = "+ Registrar factura",
}: InvoiceFormProps) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(invoice?.currencyCode ?? "COP");
  const { submit, pending, fieldErrors } = useActionSubmit<Invoice>();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    const input = {
      accountId: (form.get("accountId") as string) || null,
      clientName: (form.get("clientName") as string) || null,
      number: (form.get("number") as string) || null,
      issueDate: form.get("issueDate"),
      dueDate: (form.get("dueDate") as string) || null,
      status: form.get("status"),
      total: Number(form.get("total")),
      totalPaid: Number(form.get("totalPaid") || 0),
      currencyCode: currency,
      exchangeRate: rawRate ? Number(rawRate) : null,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () => (invoice ? updateInvoice(invoice.id, input) : createInvoice(input)),
      {
        successMessage: invoice ? "Factura actualizada" : "Factura registrada",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={invoice ? "outline" : "default"} size="sm" />}
      >
        {invoice ? "Editar" : triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Editar factura" : "Registrar factura"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accountId">Cliente (CRM)</Label>
              <NativeSelect
                id="accountId"
                name="accountId"
                defaultValue={invoice?.accountId ?? ""}
              >
                <option value="">— sin vincular —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.accountId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientName">O cliente (texto)</Label>
              <Input
                id="clientName"
                name="clientName"
                defaultValue={invoice?.clientName ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" defaultValue={invoice?.number ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issueDate">Emitida</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={invoice?.issueDate ?? today}
                required
              />
              <FieldError errors={fieldErrors.issueDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Vence</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={invoice?.dueDate ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                name="total"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={invoice?.total ?? ""}
                required
              />
              <FieldError errors={fieldErrors.total} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalPaid">Pagado</Label>
              <Input
                id="totalPaid"
                name="totalPaid"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={invoice?.totalPaid ?? 0}
              />
              <FieldError errors={fieldErrors.totalPaid} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <NativeSelect
                id="status"
                name="status"
                defaultValue={invoice?.status ?? "open"}
              >
                <option value="open">Abierta</option>
                <option value="paid">Pagada</option>
                <option value="void">Anulada</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CurrencyFields
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRateErrors={fieldErrors.exchangeRate}
              defaultExchangeRate={invoice?.exchangeRate}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar factura"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
