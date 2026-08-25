import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { financeSnapshots, syncedInvoices } from "@/modules/finance/schema";
import {
  fetchCashFlow,
  fetchProfitAndLoss,
  summarizeCashFlow,
  summarizePnl,
} from "@/integrations/alegra/reports-client";

/**
 * Snapshot diario de cartera (receivables) calculado desde la cache
 * synced_invoices, normalizando USD→COP con la TRM de cada factura.
 * Cifra de control (QA): debe cuadrar con el reporte de cartera de Alegra.
 */
export async function upsertReceivablesSnapshot(): Promise<{
  openInvoices: number;
  outstandingCop: number;
}> {
  const balanceCop = sql<string>`sum(${syncedInvoices.balance} * coalesce(${syncedInvoices.exchangeRate}, 1))`;
  const [totals] = await db
    .select({
      openInvoices: sql<number>`count(*)::int`,
      outstandingCop: balanceCop,
    })
    .from(syncedInvoices)
    .where(
      and(
        eq(syncedInvoices.status, "open"),
        isNotNull(syncedInvoices.balance),
        ne(syncedInvoices.balance, "0"),
      ),
    );

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
    .where(and(eq(syncedInvoices.status, "open"), isNotNull(syncedInvoices.balance)))
    .groupBy(sql`1`);

  const receivables = {
    openInvoices: totals?.openInvoices ?? 0,
    outstandingCop: Number(totals?.outstandingCop ?? 0),
    aging: byAging.map((row) => ({
      bucket: row.bucket,
      amountCop: Number(row.amountCop ?? 0),
      invoices: row.invoices,
    })),
  };

  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(financeSnapshots)
    .values({ snapshotDate: today, receivables })
    .onConflictDoUpdate({
      target: financeSnapshots.snapshotDate,
      set: { receivables: sql`excluded.receivables` },
    });

  return {
    openInvoices: receivables.openInvoices,
    outstandingCop: receivables.outstandingCop,
  };
}

/**
 * Snapshot diario de P&L y cashflow del mes en curso, desde el backend de
 * reportes de Alegra. Cada reporte falla aislado (el 500 de uno no pierde
 * el otro ni el sync); los errores se devuelven para sync_runs.stats.
 */
export async function upsertReportSnapshots(): Promise<{
  pnl: boolean;
  cashflow: boolean;
  errors: Record<string, string>;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;
  const errors: Record<string, string> = {};
  const set: { pnl?: unknown; cashflow?: unknown } = {};

  try {
    const tree = await fetchProfitAndLoss(monthStart, today);
    set.pnl = { from: monthStart, to: today, totals: summarizePnl(tree), tree };
  } catch (error) {
    errors.pnl = error instanceof Error ? error.message : String(error);
  }

  try {
    const sections = await fetchCashFlow(monthStart, today);
    set.cashflow = {
      from: monthStart,
      to: today,
      summary: summarizeCashFlow(sections),
      sections,
    };
  } catch (error) {
    errors.cashflow = error instanceof Error ? error.message : String(error);
  }

  if (Object.keys(set).length > 0) {
    await db
      .insert(financeSnapshots)
      .values({ snapshotDate: today, ...set })
      .onConflictDoUpdate({
        target: financeSnapshots.snapshotDate,
        set: {
          ...(set.pnl !== undefined && { pnl: sql`excluded.pnl` }),
          ...(set.cashflow !== undefined && {
            cashflow: sql`excluded.cashflow`,
          }),
        },
      });
  }

  return { pnl: set.pnl !== undefined, cashflow: set.cashflow !== undefined, errors };
}
