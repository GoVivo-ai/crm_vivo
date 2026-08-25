"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/shared/ui/field-error";
import { Segmented } from "@/shared/ui/segmented";

const CURRENCIES = [
  { value: "COP", label: "COP" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

type CurrencyFieldsProps = {
  currency: string;
  onCurrencyChange: (value: string) => void;
  /** fieldErrors.exchangeRate del ActionResult. */
  exchangeRateErrors?: string[];
  defaultExchangeRate?: number | null;
};

/**
 * Moneda + TRM del documento. La TRM solo aparece (y es obligatoria)
 * cuando la moneda no es COP — el server la exige para normalizar.
 */
export function CurrencyFields({
  currency,
  onCurrencyChange,
  exchangeRateErrors,
  defaultExchangeRate,
}: CurrencyFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Moneda</Label>
        {/* 3 opciones cortas y excluyentes → segmented (regla §12.3). */}
        <Segmented
          ariaLabel="Moneda del documento"
          value={currency}
          onChange={onCurrencyChange}
          options={CURRENCIES}
        />
      </div>
      {currency !== "COP" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exchangeRate">TRM a COP</Label>
          <Input
            id="exchangeRate"
            name="exchangeRate"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={defaultExchangeRate ?? ""}
            required
          />
          <FieldError errors={exchangeRateErrors} />
        </div>
      )}
    </>
  );
}
