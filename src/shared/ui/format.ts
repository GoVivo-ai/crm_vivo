/**
 * Formateadores compartidos de la UI. Moneda base: COP (decisión
 * multimoneda abierta) — ningún componente hardcodea el símbolo:
 * todo monto pasa por formatMoney para poder cambiar la base después.
 */

const BASE_CURRENCY = "COP";
const LOCALE = "es-CO";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: BASE_CURRENCY,
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: BASE_CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(amount: number): string {
  return money.format(amount);
}

const accountingMoney = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: BASE_CURRENCY,
  currencySign: "accounting",
  maximumFractionDigits: 0,
});

/** Estilo contable: los negativos van entre paréntesis — finanzas los tiene. */
export function formatAccountingMoney(amount: number): string {
  return accountingMoney.format(amount);
}

/** Para cabeceras de columna y KPIs donde el monto completo no cabe. */
export function formatCompactMoney(amount: number): string {
  return compactMoney.format(amount);
}

const currencyFormats = new Map<string, Intl.NumberFormat>();

/** Multi-moneda explícita (ads sin convertir a COP): "US$ 1.200", "$ 3,5 M". */
export function formatCurrency(amount: number, currency: string): string {
  const digits = Math.abs(amount) < 100 ? 2 : 0;
  const key = `${currency}:${digits}`;
  let format = currencyFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    });
    currencyFormats.set(key, format);
  }
  return format.format(amount);
}

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 2 h", "hace 3 días" — usado por el pulso de sincronización. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(Math.round(seconds), "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86400), "day");
}

/** Un sync se considera fresco si terminó hace menos de freshForMinutes. */
export function isFreshSync(syncedAt: Date, freshForMinutes: number): boolean {
  return Date.now() - syncedAt.getTime() < freshForMinutes * 60_000;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(date);
}
