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
  currency: "COP" | "USD";
  /** TRM obligatoria cuando la moneda es USD (el backend normaliza a COP). */
  trmStr: string;
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
  autoOpenEntity = false,
}: {
  type: SpotlightType;
  catalog: SpotlightCatalog;
  values: SpotlightValues;
  set: (patch: Partial<SpotlightValues>) => void;
  /** Ambigüedad del parseo (≥2 coincidencias) = combobox abierto. */
  autoOpenEntity?: boolean;
}) {
  // Formateo en vivo: se edita en dígitos, se ve $1.200.000 (m2).
  const amountDisplay =
    values.amountStr === ""
      ? ""
      : new Intl.NumberFormat("es-CO").format(Number(values.amountStr));
  const amountField = (
    <Field label={`Monto (${values.currency})`}>
      <Input
        inputMode="numeric"
        value={amountDisplay}
        onChange={(e) =>
          set({ amountStr: e.target.value.replace(/\D/g, "") })
        }
        aria-label={`Monto en ${values.currency}`}
      />
    </Field>
  );
  // La TRM solo aplica a registros con moneda propia (no al movimiento,
  // que hereda la moneda de su cuenta).
  const trmField =
    values.currency === "USD" && type !== "transaction" ? (
      <Field label="TRM (COP por USD)">
        <Input
          type="number"
          min={1}
          step="0.01"
          value={values.trmStr}
          onChange={(e) => set({ trmStr: e.target.value })}
          placeholder="4100"
          aria-label="Tasa de cambio a pesos"
        />
      </Field>
    ) : null;
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
            key={autoOpenEntity ? "ambiguo" : "normal"}
            defaultOpen={autoOpenEntity}
            options={catalog.accounts}
            value={values.entityId}
            onValueChange={(id) => set({ entityId: id })}
            ariaLabel="Cliente de la factura"
            placeholder={values.entityText || "Buscar cuenta…"}
          />
        </Field>
        {amountField}
        {trmField}
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
        {trmField}
        {dateField("Fecha")}
      </>
    );
  }

  if (type === "payroll") {
    return (
      <>
        <Field label="Persona">
          <Combobox
            key={autoOpenEntity ? "ambiguo" : "normal"}
            defaultOpen={autoOpenEntity}
            options={catalog.employees}
            value={values.entityId}
            onValueChange={(id) => set({ entityId: id })}
            ariaLabel="Persona del equipo"
            placeholder={values.entityText || "Buscar persona…"}
            required
          />
        </Field>
        {amountField}
        {trmField}
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
          key={autoOpenEntity ? "ambiguo" : "normal"}
          defaultOpen={autoOpenEntity}
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
