import { and, desc, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncedBills } from "@/modules/purchases/schema";
import type {
  AgingBucket,
  AgingBucketId,
} from "@/modules/finance/domain/types";
import type {
  MonthlySpend,
  Payables,
  SpendByCostCenter,
  SpendByProvider,
} from "@/modules/purchases/domain/types";

const totalCop = sql<string>`sum(${syncedBills.total} * coalesce(${syncedBills.exchangeRate}, 1))`;
const balanceCop = sql<string>`sum(${syncedBills.balance} * coalesce(${syncedBills.exchangeRate}, 1))`;

export async function getMonthlySpend(months: number): Promise<MonthlySpend[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${syncedBills.date}, 'YYYY-MM')`,
      totalCop,
      bills: sql<number>`count(*)::int`,
    })
    .from(syncedBills)
    .where(
      and(
        isNotNull(syncedBills.date),
        gte(
          syncedBills.date,
          sql`(date_trunc('month', current_date) - make_interval(months => ${months - 1}))::date`,
        ),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    totalCop: Number(r.totalCop ?? 0),
    bills: r.bills,
  }));
}

const inRange = (range: { from: string; to: string }) =>
  and(gte(syncedBills.date, range.from), lte(syncedBills.date, range.to));

export async function getSpendByCostCenter(range: {
  from: string;
  to: string;
}): Promise<SpendByCostCenter[]> {
  const rows = await db
    .select({
      costCenter: syncedBills.costCenter,
      totalCop,
      bills: sql<number>`count(*)::int`,
    })
    .from(syncedBills)
    .where(inRange(range))
    .groupBy(syncedBills.costCenter)
    .orderBy(sql`2 desc`);
  return rows.map((r) => ({ ...r, totalCop: Number(r.totalCop ?? 0) }));
}

export async function getSpendByProvider(
  range: { from: string; to: string },
  limit: number,
): Promise<SpendByProvider[]> {
  const rows = await db
    .select({
      alegraProviderId: syncedBills.alegraProviderId,
      providerName: sql<string | null>`max(${syncedBills.providerName})`,
      totalCop,
      bills: sql<number>`count(*)::int`,
    })
    .from(syncedBills)
    .where(inRange(range))
    .groupBy(syncedBills.alegraProviderId)
    .orderBy(sql`3 desc`)
    .limit(limit);
  return rows.map((r) => ({ ...r, totalCop: Number(r.totalCop ?? 0) }));
}

/** Cuentas por pagar vivas con aging — espejo de receivables. */
export async function getPayables(): Promise<Payables> {
  const openCondition = and(
    ne(syncedBills.status, "paid"),
    isNotNull(syncedBills.balance),
    ne(syncedBills.balance, "0"),
  );
  const [totals] = await db
    .select({
      openBills: sql<number>`count(*)::int`,
      outstandingCop: balanceCop,
    })
    .from(syncedBills)
    .where(openCondition);

  const byAging = await db
    .select({
      bucket: sql<string>`case
        when ${syncedBills.dueDate} >= current_date then 'current'
        when ${syncedBills.dueDate} >= current_date - 30 then '1-30'
        when ${syncedBills.dueDate} >= current_date - 60 then '31-60'
        when ${syncedBills.dueDate} >= current_date - 90 then '61-90'
        else '90+' end`,
      amountCop: balanceCop,
      bills: sql<number>`count(*)::int`,
    })
    .from(syncedBills)
    .where(openCondition)
    .groupBy(sql`1`);

  const order: AgingBucketId[] = ["current", "1-30", "31-60", "61-90", "90+"];
  const aging: AgingBucket[] = order.map((bucket) => {
    const row = byAging.find((r) => r.bucket === bucket);
    return {
      bucket,
      amountCop: Number(row?.amountCop ?? 0),
      invoices: row?.bills ?? 0,
    };
  });

  return {
    openBills: totals?.openBills ?? 0,
    outstandingCop: Number(totals?.outstandingCop ?? 0),
    aging,
  };
}

export async function listRecentBills(limit: number) {
  return db
    .select()
    .from(syncedBills)
    .orderBy(desc(syncedBills.date))
    .limit(limit);
}
