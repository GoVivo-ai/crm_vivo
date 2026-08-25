import { sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncedSupplierPayments } from "@/modules/purchases/schema";
import type { PayrollCostPoint } from "@/modules/people/domain/types";

/**
 * Categorías de pagos salientes que cuentan como nómina. Patrón validado
 * contra los nombres reales de Alegra ("Salario por Pagar", "Aportes...",
 * "Retenciones y Aportes de Nómina", cesantías, primas, vacaciones);
 * se ajusta con datos reales si Integraciones/QA detectan huecos.
 */
const PAYROLL_PATTERN =
  "salario|n[oó]mina|aporte|cesant[ií]a|prima|vacacion|seguridad social";

/**
 * Costo de nómina mensual DERIVADO de pagos categorizados (la API de
 * payroll no está en el plan de Alegra): expande categories JSONB y suma
 * los totales cuyo nombre matchea el patrón de nómina.
 */
export async function getPayrollCostByMonth(
  months: number,
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
    .where(
      sql`${syncedSupplierPayments.date} >= (date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    payments: r.payments,
  }));
}
