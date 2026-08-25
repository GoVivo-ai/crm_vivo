import { and, desc, eq, gte, lte, ne, type SQL, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { expenses } from "@/modules/purchases/schema";
import type {
  AgingBucket,
  AgingBucketId,
} from "@/modules/finance/domain/types";
import type {
  Expense,
  MonthlySpend,
  Payables,
  SpendByCostCenter,
  SpendByProvider,
} from "@/modules/purchases/domain/types";
import type {
  ExpenseInput,
  ExpenseListFilter,
} from "@/modules/purchases/domain/validation";

const totalCop = sql<string>`sum(${expenses.total} * coalesce(${expenses.exchangeRate}, 1))`;
const balanceCop = sql<string>`sum(${expenses.balance} * coalesce(${expenses.exchangeRate}, 1))`;
const notVoid = ne(expenses.status, "void");

type Row = typeof expenses.$inferSelect;

export function toExpense(row: Row): Expense {
  return {
    id: row.id,
    source: row.source,
    kind: row.kind,
    providerName: row.providerName,
    paymentAccountName: row.paymentAccountName,
    costCenter: row.costCenter,
    txnDate: row.txnDate,
    dueDate: row.dueDate,
    status: row.status,
    total: Number(row.total),
    balance: Number(row.balance),
    currencyCode: row.currencyCode,
    exchangeRate: row.exchangeRate === null ? null : Number(row.exchangeRate),
    notes: row.notes,
  };
}

export async function listExpenses(
  filter: ExpenseListFilter,
): Promise<Expense[]> {
  const conditions: SQL[] = [];
  if (filter.kind) conditions.push(eq(expenses.kind, filter.kind));
  if (filter.status) conditions.push(eq(expenses.status, filter.status));
  if (filter.from) conditions.push(gte(expenses.txnDate, filter.from));
  if (filter.to) conditions.push(lte(expenses.txnDate, filter.to));
  const rows = await db
    .select()
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.txnDate))
    .limit(500);
  return rows.map(toExpense);
}

export async function findExpenseRow(id: string): Promise<Row | null> {
  const rows = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return rows[0] ?? null;
}

function toRow(input: ExpenseInput, createdBy: string) {
  return {
    kind: input.kind,
    providerName: input.providerName,
    paymentAccountName: input.paymentAccountName ?? null,
    costCenter: input.costCenter ?? null,
    txnDate: input.txnDate,
    dueDate: input.dueDate ?? null,
    status: input.status,
    total: String(input.total),
    balance: String(input.status === "open" ? input.total : 0),
    currencyCode: input.currencyCode,
    exchangeRate:
      input.exchangeRate != null ? String(input.exchangeRate) : null,
    notes: input.notes ?? null,
    createdBy,
  };
}

export async function insertExpense(
  input: ExpenseInput,
  createdBy: string,
): Promise<Expense> {
  const rows = await db.insert(expenses).values(toRow(input, createdBy)).returning();
  return toExpense(rows[0]);
}

export async function updateExpenseById(
  id: string,
  input: ExpenseInput,
  createdBy: string,
): Promise<Expense | null> {
  const rows = await db
    .update(expenses)
    .set({ ...toRow(input, createdBy), updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.source, "manual")))
    .returning();
  return rows[0] ? toExpense(rows[0]) : null;
}

export async function deleteExpenseById(id: string): Promise<boolean> {
  const rows = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.source, "manual")))
    .returning({ id: expenses.id });
  return rows.length > 0;
}

export async function getMonthlySpend(months: number): Promise<MonthlySpend[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${expenses.txnDate}, 'YYYY-MM')`,
      totalCop,
      expenses: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        notVoid,
        gte(
          expenses.txnDate,
          sql`(date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
        ),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({ ...r, totalCop: Number(r.totalCop ?? 0) }));
}

const inRange = (range: { from: string; to: string }) =>
  and(notVoid, gte(expenses.txnDate, range.from), lte(expenses.txnDate, range.to));

export async function getSpendByCostCenter(range: {
  from: string;
  to: string;
}): Promise<SpendByCostCenter[]> {
  const rows = await db
    .select({
      costCenter: expenses.costCenter,
      totalCop,
      expenses: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(inRange(range))
    .groupBy(expenses.costCenter)
    .orderBy(sql`2 desc`);
  return rows.map((r) => ({ ...r, totalCop: Number(r.totalCop ?? 0) }));
}

export async function getSpendByProvider(
  range: { from: string; to: string },
  limit: number,
): Promise<SpendByProvider[]> {
  const rows = await db
    .select({
      providerName: expenses.providerName,
      totalCop,
      expenses: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(inRange(range))
    .groupBy(expenses.providerName)
    .orderBy(sql`2 desc`)
    .limit(limit);
  return rows.map((r) => ({ ...r, totalCop: Number(r.totalCop ?? 0) }));
}

/** Cuentas por pagar: facturas de proveedor (kind=bill) con saldo. */
export async function getPayables(): Promise<Payables> {
  const openCondition = and(
    eq(expenses.kind, "bill"),
    eq(expenses.status, "open"),
    ne(expenses.balance, "0"),
  );
  const [totals] = await db
    .select({
      openBills: sql<number>`count(*)::int`,
      outstandingCop: balanceCop,
    })
    .from(expenses)
    .where(openCondition);

  const byAging = await db
    .select({
      bucket: sql<string>`case
        when coalesce(${expenses.dueDate}, ${expenses.txnDate}) >= current_date then 'current'
        when coalesce(${expenses.dueDate}, ${expenses.txnDate}) >= current_date - 30 then '1-30'
        when coalesce(${expenses.dueDate}, ${expenses.txnDate}) >= current_date - 60 then '31-60'
        when coalesce(${expenses.dueDate}, ${expenses.txnDate}) >= current_date - 90 then '61-90'
        else '90+' end`,
      amountCop: balanceCop,
      expenses: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(openCondition)
    .groupBy(sql`1`);

  const order: AgingBucketId[] = ["current", "1-30", "31-60", "61-90", "90+"];
  const aging: AgingBucket[] = order.map((bucket) => {
    const row = byAging.find((r) => r.bucket === bucket);
    return {
      bucket,
      amountCop: Number(row?.amountCop ?? 0),
      invoices: row?.expenses ?? 0,
    };
  });

  return {
    openBills: totals?.openBills ?? 0,
    outstandingCop: Number(totals?.outstandingCop ?? 0),
    aging,
  };
}
