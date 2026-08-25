"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createInvoice } from "@/modules/finance/application/invoices-actions";
import { createExpense } from "@/modules/purchases/application/purchases-actions";
import { createPayrollPayment } from "@/modules/people/application/team-actions";
import { createBankTransaction } from "@/modules/treasury/application/treasury-actions";
import { formatMoney } from "@/shared/ui/format";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import type { ParsedCommand, SpotlightCatalog, SpotlightType } from "./parser";
import { shiftDays } from "./parser";
import { SpotlightFields, type SpotlightValues } from "./spotlight-fields";

const TYPE_LABELS: Record<SpotlightType, { title: string; verb: string }> = {
  invoice: { title: "Nueva factura", verb: "Guardar factura" },
  expense: { title: "Nuevo gasto", verb: "Guardar gasto" },
  payroll: { title: "Pago de nómina", verb: "Guardar pago" },
  transaction: { title: "Nuevo movimiento", verb: "Guardar movimiento" },
};

const SUCCESS: Record<SpotlightType, string> = {
  invoice: "Factura guardada",
  expense: "Gasto guardado",
  payroll: "Pago de nómina guardado",
  transaction: "Movimiento guardado",
};

/** Panel resultado del Spotlight: monto protagonista + "Entendido del
 * texto" SIEMPRE visible + campos corregibles + Enter guarda. */
export function SpotlightPanel({
  type,
  parsed,
  catalog,
  today,
  onSaved,
  onCancel,
}: {
  type: SpotlightType;
  parsed: ParsedCommand;
  catalog: SpotlightCatalog;
  today: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { submit, pending } = useActionSubmit<unknown>();
  // Correcciones del usuario; lo no tocado sigue al parseo de la barra.
  const [ov, setOv] = useState<Partial<SpotlightValues>>({});

  const date = ov.date ?? parsed.date ?? today;
  const values: SpotlightValues = {
    entityId:
      ov.entityId !== undefined
        ? ov.entityId
        : parsed.entityMatches.length === 1
          ? parsed.entityMatches[0].id
          : null,
    entityText: ov.entityText ?? parsed.entityText,
    amountStr:
      ov.amountStr ?? (parsed.amount !== null ? String(parsed.amount) : ""),
    date,
    due: ov.due ?? shiftDays(date, 30),
    period: ov.period ?? date.slice(0, 7),
    status: ov.status ?? "open",
    direction: ov.direction ?? "in",
  };
  const set = (patch: Partial<SpotlightValues>) =>
    setOv((prev) => ({ ...prev, ...patch }));

  const amount = Number(values.amountStr);
  const amountOk = Number.isFinite(amount) && amount > 0;
  const entityOk =
    type === "expense"
      ? values.entityText.trim().length > 0
      : type === "invoice"
        ? values.entityId !== null || values.entityText.trim().length > 0
        : values.entityId !== null;
  const valid = amountOk && entityOk && !pending;

  const entityName =
    type === "expense"
      ? values.entityText
      : (catalog[
          type === "invoice"
            ? "accounts"
            : type === "payroll"
              ? "employees"
              : "bankAccounts"
        ].find((e) => e.id === values.entityId)?.name ??
        values.entityText);

  function save() {
    if (!valid) return;
    const base = { successMessage: SUCCESS[type], onSuccess: onSaved };
    if (type === "invoice") {
      submit(
        () =>
          createInvoice({
            accountId: values.entityId,
            clientName: values.entityId ? null : values.entityText.trim(),
            issueDate: values.date,
            dueDate: values.due || null,
            status: values.status,
            total: amount,
            currencyCode: "COP",
          }),
        base,
      );
    } else if (type === "expense") {
      submit(
        () =>
          createExpense({
            kind: "direct",
            providerName: values.entityText.trim(),
            txnDate: values.date,
            status: "paid",
            total: amount,
            currencyCode: "COP",
          }),
        base,
      );
    } else if (type === "payroll") {
      submit(
        () =>
          createPayrollPayment({
            employeeId: values.entityId,
            period: values.period,
            amount,
            currencyCode: "COP",
            paidAt: values.date,
          }),
        base,
      );
    } else {
      submit(
        () =>
          createBankTransaction({
            bankAccountId: values.entityId,
            date: values.date,
            amount,
            direction: values.direction,
          }),
        base,
      );
    }
  }

  const understood =
    parsed.understood.length > 0 ? parsed.understood.join(" + ") : "—";

  return (
    <form
      className="overflow-hidden rounded-[20px] bg-white shadow-[0_40px_100px_-32px_rgba(0,10,30,0.7)]"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="h-[3px] bg-gradient-to-r from-[#04D98B] to-[#F2E205]" />
      <div className="px-7 pt-5 pb-1 text-center">
        <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#8B99B0]">
          {TYPE_LABELS[type].title}
          {entityName ? ` · ${entityName}` : ""}
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-[44px] leading-[1.1] font-extrabold text-[#011640] tabular-nums">
          {amountOk ? formatMoney(amount) : "—"}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#069B66]">
          Entendido del texto: {understood} · corrige abajo si algo no es
        </p>
        {type !== "expense" && parsed.entityMatches.length > 1 && (
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {parsed.entityMatches.length} coincidencias — elige abajo
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3.5 px-7 pt-3 pb-5 sm:grid-cols-3">
        <SpotlightFields
          type={type}
          catalog={catalog}
          values={values}
          set={set}
        />
      </div>
      <div className="flex items-center gap-3 border-t border-[#EDF0F5] px-7 py-3">
        <span className="text-[11.5px] font-semibold text-[#8B99B0]">
          Enter guarda · Tab siguiente campo · Esc cierra
        </span>
        <div className="ml-auto flex gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={!valid}>
            {TYPE_LABELS[type].verb} ⏎
          </Button>
        </div>
      </div>
    </form>
  );
}
