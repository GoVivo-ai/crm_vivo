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

/** Para cabeceras de columna y KPIs donde el monto completo no cabe. */
export function formatCompactMoney(amount: number): string {
  return compactMoney.format(amount);
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
