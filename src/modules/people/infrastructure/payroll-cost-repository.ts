import { sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncedSupplierPayments } from "@/modules/purchases/schema";
import type { PayrollCostPoint } from "@/modules/people/domain/types";

/**
 * Categorías de pagos salientes que cuentan como nómina. VALIDADO por
 * Integraciones contra las categorías reales de Alegra (julio 2026:
 * Salario por Pagar, Aportes EPS/Caja/ARL, Fondos de pensión PILA;
 * cifras de control: julio 19.872.080, feb-2026 25.060.732 COP
 * — incluye cesantías anuales; "cesant" sin tilde cubre id 5267).
 * "Intereses" queda fuera a propósito: existe también como categoría
 * financiera y sería un falso positivo grande (el rubro PILA es ~miles).
 * TODO v2: migrar de regex a lista de IDs de categoría (estables):
 * 5238 Salario, 5261 Fondos, 5201 EPS, 5241 Caja, 5087 ARL
 * (+5216 Intereses SOLO si el pago es al operador PILA).
 */
const PAYROLL_PATTERN =
  "salario|sueldo|n[oó]mina|aporte|cesant|prima|vacacion|seguridad social|fondos";

/**
 * Costo de nómina mensual DERIVADO de pagos categorizados (la API de
 * payroll no está en el plan de Alegra): expande categories JSONB y suma
 * los totales cuyo nombre matchea el patrón de nómina.
 */
export async function getPayrollCostByMonth(
  months: number,
): Promise<PayrollCostPoint[]> {
  return queryPayrollCost(
    sql`${syncedSupplierPayments.date} >= (date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
  );
}

/** Igual que getPayrollCostByMonth pero para un rango explícito. */
export async function getPayrollCostForRange(range: {
  from: string;
  to: string;
}): Promise<PayrollCostPoint[]> {
  return queryPayrollCost(
    sql`${syncedSupplierPayments.date} between ${range.from}::date and ${range.to}::date`,
  );
}

async function queryPayrollCost(
  dateFilter: ReturnType<typeof sql>,
): Promise<PayrollCostPoint[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${syncedSupplierPayments.date}, 'YYYY-MM')`,
      totalCop: sql<string>`sum((cat.value->>'total')::numeric)`,
      payments: sql<number>`count(distinct ${syncedSupplierPayments.id})::int`,
    })
    .from(syncedSupplierPayments)
    .innerJoin(
      sql`lateral jsonb_array_elements(${syncedSupplierPayments.categories}) as cat`,
      sql`cat.value->>'name' ~* ${PAYROLL_PATTERN}`,
    )
    .where(dateFilter)
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    payments: r.payments,
  }));
}
