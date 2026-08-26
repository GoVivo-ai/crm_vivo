"use client";

import { ReceiptText } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createExpense,
  updateExpense,
} from "@/modules/purchases/application/purchases-actions";
import type { Expense } from "@/modules/purchases/domain/types";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { formatCurrency } from "@/shared/ui/format";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

/** Registro/edición de gasto: direct = ya pagado (default), bill = a crédito. */
export function ExpenseForm({
  expense,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  expense?: Expense;
  /** Modo controlado (lo abre el menú de la fila); sin trigger propio. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [kind, setKind] = useState<"bill" | "direct">(expense?.kind ?? "direct");
  const [currency, setCurrency] = useState(expense?.currencyCode ?? "COP");
  const [status, setStatus] = useState<"open" | "paid" | "void">(
    expense?.status ?? "open",
  );
  const [totalStr, setTotalStr] = useState(expense?.total?.toString() ?? "");
  const [providerName, setProviderName] = useState(expense?.providerName ?? "");
  const { submit, pending, fieldErrors } = useActionSubmit<Expense>();
  const editing = expense !== undefined;
  const today = new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);
  const keepOpenRef = useRef(false);

  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { kind, currency, status },
  });

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
      status: kind === "direct" ? "paid" : status,
      total: Number(form.get("total")),
      currencyCode: currency,
      exchangeRate: rawRate ? Number(rawRate) : null,
      notes: (form.get("notes") as string) || null,
    };
    submit(
      () => (editing ? updateExpense(expense.id, input) : createExpense(input)),
      {
        successMessage: editing ? "Gasto actualizado" : "Gasto registrado",
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

  const totalNum = Number(totalStr);
  const lomoContext = {
    amount:
      totalStr !== "" && Number.isFinite(totalNum) && totalNum > 0
        ? formatCurrency(totalNum, currency)
        : null,
    entity: providerName || null,
  };

  return (
    <>
    <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
      {!hideTrigger && (
        <DialogTrigger
          render={<Button variant={editing ? "outline" : "default"} size="sm" />}
        >
          {editing ? "Editar" : "+ Registrar gasto"}
        </DialogTrigger>
      )}
      <CaptureDialogContent>
        <CaptureLomo icon={ReceiptText} module="Gastos" title={editing ? "Editar gasto" : "Registrar gasto"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Egreso · Gastos y compras" />
        <form ref={formRef} onSubmit={onSubmit}>
          <CaptureDialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="providerName">Proveedor</Label>
              <Input
                id="providerName"
                name="providerName"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                required
              />
              <FieldError errors={fieldErrors.providerName} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Segmented
                ariaLabel="Tipo de gasto"
                value={kind}
                onChange={setKind}
                options={[
                  { value: "direct", label: "Pagado" },
                  { value: "bill", label: "A crédito" },
                ]}
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
                value={totalStr}
                onChange={(e) => setTotalStr(e.target.value)}
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
                  <Label>Estado</Label>
                  <Segmented
                    ariaLabel="Estado del gasto"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "open", label: "Por pagar" },
                      { value: "paid", label: "Pagada" },
                      { value: "void", label: "Anulada" },
                    ]}
                  />
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
          </CaptureDialogBody>
          <CaptureDialogFooter
            submitLabel="Guardar gasto"
            pending={pending}
            onSaveAnother={
              editing
                ? undefined
                : () => {
                    keepOpenRef.current = true;
                    formRef.current?.requestSubmit();
                  }
            }
          />
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
