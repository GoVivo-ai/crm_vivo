"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

type KpiProps = {
  label: string;
  /** null = sin dato (muestra —). */
  value: number | null;
  /** money = COP; accounting = COP con negativos contables; count = entero. */
  kind?: "money" | "accounting" | "count";
  /** Moneda explícita para montos que no son COP. */
  currency?: string;
  detail?: string;
  /** lg = cifra protagonista (Nunito display grande). */
  size?: "lg" | "md";
  className?: string;
};

function formatOptions(
  kind: "money" | "accounting" | "count",
  currency: string,
): Format {
  if (kind === "count") return { maximumFractionDigits: 0 };
  return {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...(kind === "accounting" ? { currencySign: "accounting" as const } : {}),
  };
}

/**
 * Cifra clave con transición animada (NumberFlow) y jerarquía tipográfica:
 * la cifra manda, la etiqueta acompaña. Negativos en color de pérdida.
 */
export function Kpi({
  label,
  value,
  kind = "money",
  currency = "COP",
  detail,
  size = "md",
  className,
}: KpiProps) {
  const negative = value !== null && value < 0;
  return (
    <div
      className={cn(
        "group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-[family-name:var(--font-display)] leading-none font-bold tabular-nums",
          size === "lg" ? "text-[36px]" : "text-2xl",
          negative && "text-health-critical",
        )}
      >
        {value === null ? (
          <span className="text-muted-foreground/50">—</span>
        ) : (
          <NumberFlow
            value={value}
            locales="es-CO"
            format={formatOptions(kind, currency)}
            respectMotionPreference
          />
        )}
      </p>
      {detail && (
        <p className="text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}

/** Varias monedas en un solo KPI — jamás se suman entre sí. */
export function KpiMultiCurrency({
  label,
  amounts,
  kind = "money",
  detail,
  className,
}: {
  label: string;
  amounts: Record<string, number>;
  kind?: "money" | "accounting";
  detail?: string;
  className?: string;
}) {
  const entries = Object.entries(amounts);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-0.5 font-[family-name:var(--font-display)] text-2xl leading-tight font-bold tabular-nums">
        {entries.length === 0 ? (
          <span className="text-muted-foreground/50">—</span>
        ) : (
          entries.map(([currency, amount]) => (
            <NumberFlow
              key={currency}
              value={amount}
              locales="es-CO"
              format={formatOptions(kind, currency)}
              respectMotionPreference
              className={cn(amount < 0 && "text-health-critical")}
            />
          ))
        )}
      </div>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
