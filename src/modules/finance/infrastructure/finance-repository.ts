import { and, eq, gte, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { invoices } from "@/modules/finance/schema";
import { expenses } from "@/modules/purchases/schema";
import { payrollPayments } from "@/modules/people/schema";
import { bankTransactions } from "@/modules/treasury/schema";
import type {
  AgingBucket,
  AgingBucketId,
  CashflowPoint,
  MonthlyBilling,
  PnlPoint,
  Receivables,
} from "@/modules/finance/domain/types";

const invoiceCop = sql<string>`sum(${invoices.total} * coalesce(${invoices.exchangeRate}, 1))`;
const balanceCop = sql<string>`sum(${invoices.balance} * coalesce(${invoices.exchangeRate}, 1))`;

const monthsBack = (months: number) =>
  sql`(date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`;

/** Facturación mensual (COP) de los últimos `months` meses. */
export async function getMonthlyBilling(
  months: number,
): Promise<MonthlyBilling[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`,
      totalCop: invoiceCop,
      invoices: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(
      and(ne(invoices.status, "void"), gte(invoices.issueDate, monthsBack(months))),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    invoices: r.invoices,
  }));
}

/** Cartera viva con aging desde las facturas abiertas. */
export async function getReceivables(): Promise<Receivables> {
  const openCondition = and(
    eq(invoices.status, "open"),
    isNotNull(invoices.balance),
    ne(invoices.balance, "0"),
  );
  const [totals] = await db
    .select({
      openInvoices: sql<number>`count(*)::int`,
      outstandingCop: balanceCop,
    })
    .from(invoices)
    .where(openCondition);

  const byAging = await db
    .select({
      bucket: sql<string>`case
        when coalesce(${invoices.dueDate}, ${invoices.issueDate}) >= current_date then 'current'
        when coalesce(${invoices.dueDate}, ${invoices.issueDate}) >= current_date - 30 then '1-30'
        when coalesce(${invoices.dueDate}, ${invoices.issueDate}) >= current_date - 60 then '31-60'
        when coalesce(${invoices.dueDate}, ${invoices.issueDate}) >= current_date - 90 then '61-90'
        else '90+' end`,
      amountCop: balanceCop,
      invoices: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(openCondition)
    .groupBy(sql`1`);

  const order: AgingBucketId[] = ["current", "1-30", "31-60", "61-90", "90+"];
  const aging: AgingBucket[] = order.map((bucket) => {
    const row = byAging.find((r) => r.bucket === bucket);
    return {
      bucket,
      amountCop: Number(row?.amountCop ?? 0),
      invoices: row?.invoices ?? 0,
    };
  });

  return {
    openInvoices: totals?.openInvoices ?? 0,
    outstandingCop: Number(totals?.outstandingCop ?? 0),
    aging,
  };
}

type MonthTotal = { month: string; total: string };

const byMonth = (rows: MonthTotal[]) =>
  new Map(rows.map((r) => [r.month, Number(r.total ?? 0)]));

/** P&L mensual calculado: ingresos − gastos − nómina, todo COP. */
export async function getPnlByMonth(months: number): Promise<PnlPoint[]> {
  const [income, expense, payroll] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`,
        total: invoiceCop,
      })
      .from(invoices)
      .where(
        and(ne(invoices.status, "void"), gte(invoices.issueDate, monthsBack(months))),
      )
      .groupBy(sql`1`),
    db
      .select({
        month: sql<string>`to_char(${expenses.txnDate}, 'YYYY-MM')`,
        total: sql<string>`sum(${expenses.total} * coalesce(${expenses.exchangeRate}, 1))`,
      })
      .from(expenses)
      .where(
        and(ne(expenses.status, "void"), gte(expenses.txnDate, monthsBack(months))),
      )
      .groupBy(sql`1`),
    db
      .select({
        month: payrollPayments.period,
        total: sql<string>`sum(${payrollPayments.amount} * coalesce(${payrollPayments.exchangeRate}, 1))`,
      })
      .from(payrollPayments)
      .where(
        gte(sql`(${payrollPayments.period} || '-01')::date`, monthsBack(months)),
      )
      .groupBy(payrollPayments.period),
  ]);

  const incomeMap = byMonth(income);
  const expenseMap = byMonth(expense);
  const payrollMap = byMonth(payroll);
  const allMonths = [
    ...new Set([...incomeMap.keys(), ...expenseMap.keys(), ...payrollMap.keys()]),
  ].sort();
  return allMonths.map((month) => {
    const incomeCop = incomeMap.get(month) ?? 0;
    const expensesCop = expenseMap.get(month) ?? 0;
    const payrollCop = payrollMap.get(month) ?? 0;
    return {
      month,
      incomeCop,
      expensesCop,
      payrollCop,
      netIncomeCop: incomeCop - expensesCop - payrollCop,
    };
  });
}

/** Flujo de caja mensual desde movimientos bancarios registrados. */
export async function getCashflowByMonth(
  months: number,
): Promise<CashflowPoint[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${bankTransactions.date}, 'YYYY-MM')`,
      inflow: sql<string>`coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.direction} = 'in'), 0)`,
      outflow: sql<string>`coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.direction} = 'out'), 0)`,
    })
    .from(bankTransactions)
    .where(gte(bankTransactions.date, monthsBack(months)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    inflowCop: Number(r.inflow),
    outflowCop: Number(r.outflow),
    netCop: Number(r.inflow) - Number(r.outflow),
  }));
}
