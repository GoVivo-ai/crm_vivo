"use client";

import { Landmark } from "lucide-react";
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
  createBankAccount,
  updateBankAccount,
} from "@/modules/treasury/application/treasury-actions";
import type { BankAccountView } from "@/modules/treasury/domain/types";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { formatCurrency } from "@/shared/ui/format";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

/** Alta/edición de cuenta manual — el saldo se actualiza guardando aquí. */
export function BankAccountForm({
  account,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  account?: BankAccountView;
  /** Modo controlado (lo abre el menú de la fila); sin trigger propio. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [currency, setCurrency] = useState(account?.currencyCode ?? "COP");
  const [type, setType] = useState(account?.type ?? "bank");
  const [balanceStr, setBalanceStr] = useState(
    account?.balance?.toString() ?? "",
  );
  const [name, setName] = useState(account?.name ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const editing = account !== undefined;

  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { currency, type },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawRate = form.get("exchangeRate") as string | null;
    const input = {
      name: form.get("name"),
      type,
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

  const balanceNum = Number(balanceStr);
  const lomoContext = {
    amount:
      balanceStr !== "" && Number.isFinite(balanceNum)
        ? formatCurrency(balanceNum, currency)
        : null,
    entity: name || null,
  };

  return (
    <>
    <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
      {!hideTrigger && (
        <DialogTrigger
          render={<Button variant={editing ? "outline" : "default"} size="sm" />}
        >
          {editing ? "Editar" : "+ Cuenta bancaria"}
        </DialogTrigger>
      )}
      <CaptureDialogContent>
        <CaptureLomo icon={Landmark} module="Tesorería" title={editing ? `Editar · ${account.name}` : "Nueva cuenta bancaria"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Bancos · Tesorería" />
        <form ref={formRef} onSubmit={onSubmit}>
          <CaptureDialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <FieldError errors={fieldErrors.name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Segmented
                ariaLabel="Tipo de cuenta"
                value={type}
                onChange={setType}
                options={[
                  { value: "bank", label: "Banco" },
                  { value: "cash", label: "Caja" },
                  { value: "credit-card", label: "Tarjeta" },
                ]}
              />
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
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value)}
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
