"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";

const CURRENCIES = ["COP", "USD", "EUR"];

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
        <Label htmlFor="currencyCode">Moneda</Label>
        <NativeSelect
          id="currencyCode"
          name="currencyCode"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
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
