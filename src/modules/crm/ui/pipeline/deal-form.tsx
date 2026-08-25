"use client";

import { Handshake } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDeal } from "@/modules/crm/application/deals-actions";
import type { Deal, PipelineStage } from "@/modules/crm/domain/types";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { Combobox } from "@/shared/ui/combobox";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { formatCurrency } from "@/shared/ui/format";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type Option = { id: string; name: string };

type DealFormProps = {
  accounts: Option[];
  stages: PipelineStage[];
  /** Etapa preseleccionada (slot "+ Nuevo negocio" del kanban). */
  initialStageId?: string | null;
  /** Modo controlado (lo abre el board); sin trigger propio. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function DealForm({
  accounts,
  stages,
  initialStageId = null,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: DealFormProps) {
  const openStages = stages.filter((s) => !s.isWon && !s.isLost);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [accountId, setAccountId] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string | null>(
    initialStageId ?? openStages[0]?.id ?? null,
  );
  const [currency, setCurrency] = useState("COP");
  const [amountStr, setAmountStr] = useState("");
  const { submit, pending, fieldErrors } = useActionSubmit<Deal>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { accountId, stageId, currency },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawAmount = form.get("amount") as string;
    submit(
      () =>
        createDeal({
          title: form.get("title"),
          accountId,
          stageId,
          amount: rawAmount === "" ? null : Number(rawAmount),
          currency,
          expectedCloseDate: (form.get("expectedCloseDate") as string) || null,
        }),
      {
        successMessage: `Negocio ${form.get("title")} creado`,
        onSuccess: () => setOpen(false),
      },
    );
  }

  const amountNum = Number(amountStr);
  const lomoContext = {
    amount:
      amountStr !== "" && Number.isFinite(amountNum) && amountNum > 0
        ? formatCurrency(amountNum, currency)
        : null,
    entity: accounts.find((a) => a.id === accountId)?.name ?? null,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        {!hideTrigger && (
          <DialogTrigger render={<Button size="sm" />}>Nuevo negocio</DialogTrigger>
        )}
        <CaptureDialogContent>
          <CaptureLomo icon={Handshake} module="CRM" title={"Nuevo negocio"} context={lomoContext} />
        <div className="flex min-w-0 flex-col">
        <CaptureDialogBar subtitle="Pipeline · CRM" />
          <form ref={formRef} onSubmit={onSubmit}>
            <CaptureDialogBody>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required />
                <FieldError errors={fieldErrors.title} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Cuenta</Label>
                  <Combobox
                    ariaLabel="Cuenta del negocio"
                    options={accounts}
                    value={accountId}
                    onValueChange={setAccountId}
                    placeholder="Buscar cuenta…"
                    required
                  />
                  <FieldError errors={fieldErrors.accountId} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Etapa</Label>
                  <Combobox
                    ariaLabel="Etapa inicial"
                    options={openStages.map((s) => ({ id: s.id, name: s.name }))}
                    value={stageId}
                    onValueChange={setStageId}
                    placeholder="Buscar etapa…"
                    required
                  />
                  <FieldError errors={fieldErrors.stageId} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                  />
                  <FieldError errors={fieldErrors.amount} />
                </div>
                <CurrencyFields
                  currency={currency}
                  onCurrencyChange={setCurrency}
                  exchangeRateErrors={fieldErrors.exchangeRate}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expectedCloseDate">Cierre esperado</Label>
                <Input
                  id="expectedCloseDate"
                  name="expectedCloseDate"
                  type="date"
                />
                <FieldError errors={fieldErrors.expectedCloseDate} />
              </div>
            </CaptureDialogBody>
            <CaptureDialogFooter submitLabel="Crear negocio" pending={pending} />
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
