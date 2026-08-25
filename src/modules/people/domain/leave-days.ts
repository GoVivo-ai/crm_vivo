import Holidays from "date-holidays";

/**
 * Método de conteo de días de ausencia — FUNCIÓN ÚNICA CONMUTABLE
 * (directriz Planeador): 'business-days-co' = L–V excluyendo festivos de
 * Colombia (estándar legal para vacaciones; la ley Emiliani la calcula
 * date-holidays). Si Victor decide días calendario, cambiar SOLO esta
 * constante a 'calendar' — unidad y label de UI van siempre juntos.
 */
const LEAVE_DAY_METHOD: "business-days-co" | "calendar" = "business-days-co";

const holidaysByYear = new Map<number, Set<string>>();

function coHolidays(year: number): Set<string> {
  let set = holidaysByYear.get(year);
  if (!set) {
    const hd = new Holidays("CO");
    set = new Set(
      hd
        .getHolidays(year)
        .filter((h) => h.type === "public")
        .map((h) => h.date.slice(0, 10)),
    );
    holidaysByYear.set(year, set);
  }
  return set;
}

/** Días de ausencia entre start y end (YYYY-MM-DD, inclusive). */
export function countLeaveDays(start: string, end: string): number {
  if (LEAVE_DAY_METHOD === "calendar") {
    return (
      Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
    );
  }
  let days = 0;
  const cursor = new Date(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  while (cursor.getTime() <= endMs) {
    const dow = cursor.getUTCDay();
    const iso = cursor.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !coHolidays(cursor.getUTCFullYear()).has(iso)) {
      days += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Descripción del método vigente — para que la UI etiquete la unidad. */
export const LEAVE_DAY_UNIT =
  LEAVE_DAY_METHOD === "business-days-co"
    ? ("días hábiles (Colombia)" as const)
    : ("días calendario" as const);
