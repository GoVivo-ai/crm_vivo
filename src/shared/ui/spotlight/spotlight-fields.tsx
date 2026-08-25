"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/shared/ui/combobox";
import { Segmented } from "@/shared/ui/segmented";
import type { SpotlightCatalog, SpotlightType } from "./parser";

/** Valores efectivos del panel (parseo + correcciones del usuario). */
export type SpotlightValues = {
  entityId: string | null;
  entityText: string;
  amountStr: string;
  date: string;
  due: string;
  period: string;
  status: "open" | "paid";
  direction: "in" | "out";
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className="text-xs font-bold">{label}</Label>
      {children}
    </div>
  );
}

/** Campos restantes por tipo — "corrige abajo si algo no es". */
export function SpotlightFields({
  type,
  catalog,
  values,
  set,
}: {
  type: SpotlightType;
  catalog: SpotlightCatalog;
  values: SpotlightValues;
  set: (patch: Partial<SpotlightValues>) => void;
}) {
  const amountField = (
    <Field label="Monto (COP)">
      <Input
        type="number"
        min={1}
        value={values.amountStr}
        onChange={(e) => set({ amountStr: e.target.value })}
        aria-label="Monto en pesos"
      />
    </Field>
  );
  const dateField = (label: string) => (
    <Field label={label}>
      <Input
        type="date"
        value={values.date}
        onChange={(e) => set({ date: e.target.value })}
        aria-label={label}
      />
    </Field>
  );

  if (type === "invoice") {
    return (
      <>
        <Field label="Cliente">
          <Combobox
            options={catalog.accounts}
            value={values.entityId}
            onValueChange={(id) => set({ entityId: id })}
            ariaLabel="Cliente de la factura"
            placeholder={values.entityText || "Buscar cuenta…"}
          />
        </Field>
        {amountField}
        {dateField("Emitida")}
        <Field label="Vence">
          <Input
            type="date"
            value={values.due}
            onChange={(e) => set({ due: e.target.value })}
            aria-label="Fecha de vencimiento"
          />
        </Field>
        <Field label="Estado">
          <Segmented
            value={values.status}
            onChange={(v) => set({ status: v })}
            options={[
              { value: "open", label: "Abierta" },
              { value: "paid", label: "Pagada" },
            ]}
            ariaLabel="Estado de la factura"
          />
        </Field>
      </>
    );
  }

  if (type === "expense") {
    return (
      <>
        <Field label="Proveedor">
          <Input
            value={values.entityText}
            onChange={(e) => set({ entityText: e.target.value })}
            aria-label="Nombre del proveedor"
          />
        </Field>
        {amountField}
        {dateField("Fecha")}
      </>
    );
  }

  if (type === "payroll") {
    return (
      <>
        <Field label="Persona">
          <Combobox
            options={catalog.employees}
            value={values.entityId}
            onValueChange={(id) => set({ entityId: id })}
            ariaLabel="Persona del equipo"
            placeholder={values.entityText || "Buscar persona…"}
            required
          />
        </Field>
        {amountField}
        <Field label="Periodo">
          <Input
            value={values.period}
            onChange={(e) => set({ period: e.target.value })}
            placeholder="2026-08"
            aria-label="Periodo YYYY-MM"
          />
        </Field>
        {dateField("Pagada el")}
      </>
    );
  }

  return (
    <>
      <Field label="Cuenta">
        <Combobox
          options={catalog.bankAccounts}
          value={values.entityId}
          onValueChange={(id) => set({ entityId: id })}
          ariaLabel="Cuenta bancaria"
          placeholder={values.entityText || "Buscar cuenta…"}
          required
        />
      </Field>
      {amountField}
      {dateField("Fecha")}
      <Field label="Dirección">
        <Segmented
          value={values.direction}
          onChange={(v) => set({ direction: v })}
          options={[
            { value: "in", label: "Entrada" },
            { value: "out", label: "Salida" },
          ]}
          ariaLabel="Dirección del movimiento"
        />
      </Field>
    </>
  );
}
