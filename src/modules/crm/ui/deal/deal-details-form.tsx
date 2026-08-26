"use client";

import { Handshake } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { updateDeal } from "@/modules/crm/application/deals-actions";
import type { Deal } from "@/modules/crm/domain/types";
import { Combobox } from "@/shared/ui/combobox";
import { CurrencyFields } from "@/shared/ui/currency-fields";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { FieldError } from "@/shared/ui/field-error";
import { formatCurrency } from "@/shared/ui/format";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";

type Option = { id: string; name: string };

/** "Editar sección →" de los Detalles del negocio (§15.1). */
export function DealDetailsForm({
  deal,
  contacts,
}: {
  deal: Deal;
  /** Contactos de la cuenta del negocio. */
  contacts: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState<string | null>(deal.contactId);
  const [currency, setCurrency] = useState(deal.currency);
  const [amountStr, setAmountStr] = useState(
    deal.amount !== null ? String(deal.amount) : "",
  );
  const { submit, pending, fieldErrors } = useActionSubmit<Deal>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({
    open,
    setOpen,
    formRef,
    extraState: { contactId, currency },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        updateDeal(deal.id, {
          title: form.get("title"),
          accountId: deal.accountId,
          contactId,
          stageId: deal.stageId,
          ownerId: deal.ownerId,
          amount: amountStr === "" ? null : Number(amountStr),
          currency,
          expectedCloseDate:
            (form.get("expectedCloseDate") as string) || null,
        }),
      {
        successMessage: "Negocio actualizado",
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
    entity: deal.title,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="ml-auto text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
            />
          }
        >
          Editar sección →
        </DialogTrigger>
        <CaptureDialogContent>
          <CaptureLomo
            icon={Handshake}
            module="CRM"
            title="Detalles del negocio"
            context={lomoContext}
          />
          <div className="flex min-w-0 flex-col">
            <CaptureDialogBar subtitle="Pipeline · CRM" />
            <form ref={formRef} onSubmit={onSubmit}>
              <CaptureDialogBody>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" defaultValue={deal.title} required />
                  <FieldError errors={fieldErrors.title} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Contacto</Label>
                    <Combobox
                      ariaLabel="Contacto del negocio"
                      options={contacts}
                      value={contactId}
                      onValueChange={setContactId}
                      placeholder="Buscar contacto…"
                    />
                    <FieldError errors={fieldErrors.contactId} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="expectedCloseDate">Cierre estimado</Label>
                    <Input
                      id="expectedCloseDate"
                      name="expectedCloseDate"
                      type="date"
                      defaultValue={deal.expectedCloseDate ?? ""}
                    />
                    <FieldError errors={fieldErrors.expectedCloseDate} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min={0}
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                    />
                    <FieldError errors={fieldErrors.amount} />
                  </div>
                  <CurrencyFields
                    currency={currency}
                    onCurrencyChange={setCurrency}
                  />
                </div>
              </CaptureDialogBody>
              <CaptureDialogFooter
                submitLabel="Guardar negocio"
                pending={pending}
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
