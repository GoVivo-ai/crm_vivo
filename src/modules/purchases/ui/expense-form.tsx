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
  createExpense,
  updateExpense,
} from "@/modules/purchases/application/purchases-actions";
import type { Expense } from "@/modules/purchases/domain/types";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

/** Registro/edición de gasto: direct = ya pagado (default), bill = a crédito. */
export function ExpenseForm({ expense }: { expense?: Expense }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"bill" | "direct">(expense?.kind ?? "direct");
  const [currency, setCurrency] = useState(expense?.currencyCode ?? "COP");
  const { submit, pending, fieldErrors } = useActionSubmit<Expense>();
  const editing = expense !== undefined;
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    const input = {
      kind,
      providerName: form.get("providerName"),
      paymentAccountName: (form.get("paymentAccountName") as string) || null,
      costCenter: (form.get("costCenter") as string) || null,
      txnDate: form.get("txnDate"),
      dueDate: (form.get("dueDate") as string) || null,
      status: kind === "direct" ? "paid" : form.get("status"),
      total: Number(form.get("total")),
      currencyCode: currency,
      exchangeRate: rawRate ? Number(rawRate) : null,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () => (editing ? updateExpense(expense.id, input) : createExpense(input)),
      {
        successMessage: editing ? "Gasto actualizado" : "Gasto registrado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={editing ? "outline" : "default"} size="sm" />}
      >
        {editing ? "Editar" : "+ Registrar gasto"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar gasto" : "Registrar gasto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="providerName">Proveedor</Label>
              <Input
                id="providerName"
                name="providerName"
                defaultValue={expense?.providerName ?? ""}
                required
              />
              <FieldError errors={fieldErrors.providerName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kind">Tipo</Label>
              <NativeSelect
                id="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as "bill" | "direct")}
              >
                <option value="direct">Pagado (directo)</option>
                <option value="bill">A crédito (por pagar)</option>
              </NativeSelect>
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
                defaultValue={expense?.total ?? ""}
                required
              />
              <FieldError errors={fieldErrors.total} />
            </div>
            <CurrencyFields
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRateErrors={fieldErrors.exchangeRate}
              defaultExchangeRate={expense?.exchangeRate}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="txnDate">Fecha</Label>
              <Input
                id="txnDate"
                name="txnDate"
                type="date"
                defaultValue={expense?.txnDate ?? today}
                required
              />
              <FieldError errors={fieldErrors.txnDate} />
            </div>
            {kind === "bill" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dueDate">Vence</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={expense?.dueDate ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="status">Estado</Label>
                  <NativeSelect
                    id="status"
                    name="status"
                    defaultValue={expense?.status ?? "open"}
                  >
                    <option value="open">Por pagar</option>
                    <option value="paid">Pagada</option>
                    <option value="void">Anulada</option>
                  </NativeSelect>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="costCenter">Centro de costo</Label>
              <Input
                id="costCenter"
                name="costCenter"
                placeholder="Administrativo, Servicios…"
                defaultValue={expense?.costCenter ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentAccountName">Pagado desde</Label>
              <Input
                id="paymentAccountName"
                name="paymentAccountName"
                placeholder="Cuenta o medio de pago"
                defaultValue={expense?.paymentAccountName ?? ""}
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar gasto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
