import { and, desc, eq, gte, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { financeSnapshots, syncedInvoices } from "@/modules/finance/schema";
import type {
  AgingBucket,
  AgingBucketId,
  MonthlyBilling,
  Receivables,
} from "@/modules/finance/domain/types";

const balanceCop = sql<string>`sum(${syncedInvoices.balance} * coalesce(${syncedInvoices.exchangeRate}, 1))`;
const totalCop = sql<string>`sum(${syncedInvoices.total} * coalesce(${syncedInvoices.exchangeRate}, 1))`;

/** Facturación mensual (COP) de los últimos `months` meses. */
export async function getMonthlyBilling(
  months: number,
): Promise<MonthlyBilling[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${syncedInvoices.date}, 'YYYY-MM')`,
      totalCop,
      invoices: sql<number>`count(*)::int`,
    })
    .from(syncedInvoices)
    .where(
      and(
        isNotNull(syncedInvoices.date),
        gte(
          syncedInvoices.date,
          sql`(date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
        ),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    invoices: r.invoices,
  }));
}

/** Cartera viva con aging, calculada al momento desde synced_invoices. */
export async function getReceivables(): Promise<Receivables> {
  const openCondition = and(
    eq(syncedInvoices.status, "open"),
    isNotNull(syncedInvoices.balance),
    ne(syncedInvoices.balance, "0"),
  );
  const [totals] = await db
    .select({
      openInvoices: sql<number>`count(*)::int`,
      outstandingCop: balanceCop,
    })
    .from(syncedInvoices)
    .where(openCondition);

  const byAging = await db
    .select({
      bucket: sql<string>`case
        when ${syncedInvoices.dueDate} >= current_date then 'current'
        when ${syncedInvoices.dueDate} >= current_date - 30 then '1-30'
        when ${syncedInvoices.dueDate} >= current_date - 60 then '31-60'
        when ${syncedInvoices.dueDate} >= current_date - 90 then '61-90'
        else '90+' end`,
      amountCop: balanceCop,
      invoices: sql<number>`count(*)::int`,
    })
    .from(syncedInvoices)
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

export type SnapshotRow = typeof financeSnapshots.$inferSelect;

export async function getLatestSnapshot(): Promise<SnapshotRow | null> {
  const rows = await db
    .select()
    .from(financeSnapshots)
    .orderBy(desc(financeSnapshots.snapshotDate))
    .limit(1);
  return rows[0] ?? null;
}

/** Snapshots ascendentes de los últimos `days` días (para series). */
export async function getSnapshotsSince(days: number): Promise<SnapshotRow[]> {
  return db
    .select()
    .from(financeSnapshots)
    .where(
      gte(
        financeSnapshots.snapshotDate,
        sql`(current_date - make_interval(days => ${days}))::date`,
      ),
    )
    .orderBy(financeSnapshots.snapshotDate);
}
