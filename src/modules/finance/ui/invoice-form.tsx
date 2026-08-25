"use client";

import { FileText } from "lucide-react";
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
  createInvoice,
  updateInvoice,
} from "@/modules/finance/application/invoices-actions";
import type { Invoice } from "@/modules/finance/domain/types";
import { Combobox } from "@/shared/ui/combobox";
import { formatCurrency } from "@/shared/ui/format";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

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
  const [accountId, setAccountId] = useState<string | null>(
    invoice?.accountId ?? null,
  );
  const [status, setStatus] = useState<"open" | "paid" | "void">(
    invoice?.status ?? "open",
  );
  const [totalStr, setTotalStr] = useState(invoice?.total?.toString() ?? "");
  const { submit, pending, fieldErrors } = useActionSubmit<Invoice>();
  const today = new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);
  const keepOpenRef = useRef(false);

  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { currency, accountId, status },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    const input = {
      accountId,
      clientName: (form.get("clientName") as string) || null,
      number: (form.get("number") as string) || null,
      issueDate: form.get("issueDate"),
      dueDate: (form.get("dueDate") as string) || null,
      status,
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
    entity: accounts.find((a) => a.id === accountId)?.name ?? null,
  };

  return (
    <>
    <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
      <DialogTrigger
        render={<Button variant={invoice ? "outline" : "default"} size="sm" />}
      >
        {invoice ? "Editar" : triggerLabel}
      </DialogTrigger>
      <CaptureDialogContent>
        <CaptureLomo icon={FileText} module="Finanzas" title={invoice ? "Editar factura" : "Registrar factura"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Ingreso · Finanzas" />
        <form ref={formRef} onSubmit={onSubmit}>
          <CaptureDialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Cliente (CRM)</Label>
              <Combobox
                ariaLabel="Cliente CRM"
                options={accounts}
                value={accountId}
                onValueChange={setAccountId}
                placeholder="Buscar cuenta…"
              />
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
                value={totalStr}
                onChange={(e) => setTotalStr(e.target.value)}
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
              <Label>Estado</Label>
              <Segmented
                ariaLabel="Estado de la factura"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "open", label: "Abierta" },
                  { value: "paid", label: "Pagada" },
                  { value: "void", label: "Anulada" },
                ]}
              />
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
          </CaptureDialogBody>
          <CaptureDialogFooter
            submitLabel="Guardar factura"
            pending={pending}
            onSaveAnother={
              invoice
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
