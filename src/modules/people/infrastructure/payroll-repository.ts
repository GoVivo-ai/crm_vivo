import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { employees, payrollPayments } from "@/modules/people/schema";
import type {
  PayrollCostPoint,
  PayrollPayment,
} from "@/modules/people/domain/types";
import type { PayrollPaymentInput } from "@/modules/people/domain/validation";

type Row = typeof payrollPayments.$inferSelect;

function toPayment(row: Row, employeeName: string | null): PayrollPayment {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName,
    period: row.period,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    exchangeRate: row.exchangeRate === null ? null : Number(row.exchangeRate),
    paidAt: row.paidAt,
    notes: row.notes,
  };
}

export async function listPaymentsForEmployee(
  employeeId: string,
): Promise<PayrollPayment[]> {
  const rows = await db
    .select()
    .from(payrollPayments)
    .where(eq(payrollPayments.employeeId, employeeId))
    .orderBy(desc(payrollPayments.period));
  return rows.map((r) => toPayment(r, null));
}

export async function listRecentPayments(
  limit: number,
): Promise<PayrollPayment[]> {
  const rows = await db
    .select({ payment: payrollPayments, employeeName: employees.fullName })
    .from(payrollPayments)
    .innerJoin(employees, eq(payrollPayments.employeeId, employees.id))
    .orderBy(desc(payrollPayments.paidAt))
    .limit(limit);
  return rows.map((r) => toPayment(r.payment, r.employeeName));
}

export async function insertPayment(
  input: PayrollPaymentInput,
  createdBy: string,
): Promise<PayrollPayment> {
  const rows = await db
    .insert(payrollPayments)
    .values({
      employeeId: input.employeeId,
      period: input.period,
      amount: String(input.amount),
      currencyCode: input.currencyCode,
      exchangeRate:
        input.exchangeRate != null ? String(input.exchangeRate) : null,
      paidAt: input.paidAt,
      notes: input.notes ?? null,
      createdBy,
    })
    .returning();
  return toPayment(rows[0], null);
}

export async function deletePaymentById(id: string): Promise<boolean> {
  const rows = await db
    .delete(payrollPayments)
    .where(eq(payrollPayments.id, id))
    .returning({ id: payrollPayments.id });
  return rows.length > 0;
}

const amountCop = sql<string>`sum(${payrollPayments.amount} * coalesce(${payrollPayments.exchangeRate}, 1))`;

/** Serie mensual de costo de nómina (COP) por periodo. */
export async function getPayrollCostByMonth(
  months: number,
): Promise<PayrollCostPoint[]> {
  const rows = await db
    .select({
      month: payrollPayments.period,
      totalCop: amountCop,
      payments: sql<number>`count(*)::int`,
    })
    .from(payrollPayments)
    .where(
      gte(
        sql`(${payrollPayments.period} || '-01')::date`,
        sql`(date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
      ),
    )
    .groupBy(payrollPayments.period)
    .orderBy(payrollPayments.period);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    payments: r.payments,
  }));
}

export type EmployeeMonthCost = {
  employeeId: string;
  month: string;
  amountCop: number;
};

/** Pagos por empleado y mes en un rango — para el prorrateo real de F9. */
export async function getPaymentsByEmployeeMonth(range: {
  from: string;
  to: string;
}): Promise<EmployeeMonthCost[]> {
  const rows = await db
    .select({
      employeeId: payrollPayments.employeeId,
      month: payrollPayments.period,
      amountCop: amountCop,
    })
    .from(payrollPayments)
    .where(
      sql`(${payrollPayments.period} || '-01')::date between date_trunc('month', ${range.from}::date) and ${range.to}::date`,
    )
    .groupBy(payrollPayments.employeeId, payrollPayments.period);
  return rows.map((r) => ({ ...r, amountCop: Number(r.amountCop ?? 0) }));
}
