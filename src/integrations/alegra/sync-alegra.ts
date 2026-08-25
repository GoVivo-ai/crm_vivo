import { sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncedInvoices, syncedPayments } from "@/modules/finance/schema";
import {
  getLastStats,
  runSync,
  saveRunStats,
  type SyncStats,
} from "@/integrations/shared/sync-run";
import { alegraPages } from "@/integrations/alegra/alegra-client";
import { mapInvoice, mapPayment } from "@/integrations/alegra/mappers";
import type { AlegraInvoice, AlegraPayment } from "@/integrations/alegra/types";
import {
  upsertReceivablesSnapshot,
  upsertReportSnapshots,
} from "@/integrations/alegra/snapshots";

/** Páginas por ejecución: acota el backfill al timeout del cron (300s). */
const MAX_PAGES_PER_RUN = 40;
/** Ventana incremental: re-sincroniza este rango una vez hecho el backfill. */
const INCREMENTAL_DAYS = 90;

interface AlegraCursor {
  invoicesCursor?: number;
  invoicesBackfillDone?: boolean;
  paymentsCursor?: number;
  paymentsBackfillDone?: boolean;
}

function windowStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - INCREMENTAL_DAYS);
  return d.toISOString().slice(0, 10);
}

const invoiceUpdateCols = {
  numberFull: sql`excluded.number_full`,
  alegraClientId: sql`excluded.alegra_client_id`,
  date: sql`excluded.date`,
  dueDate: sql`excluded.due_date`,
  status: sql`excluded.status`,
  stampLegalStatus: sql`excluded.stamp_legal_status`,
  subtotal: sql`excluded.subtotal`,
  tax: sql`excluded.tax`,
  total: sql`excluded.total`,
  totalPaid: sql`excluded.total_paid`,
  balance: sql`excluded.balance`,
  currencyCode: sql`excluded.currency_code`,
  exchangeRate: sql`excluded.exchange_rate`,
  raw: sql`excluded.raw`,
  syncedAt: sql`excluded.synced_at`,
};

async function upsertInvoices(invoices: AlegraInvoice[]): Promise<number> {
  if (invoices.length === 0) return 0;
  await db
    .insert(syncedInvoices)
    .values(invoices.map(mapInvoice))
    .onConflictDoUpdate({
      target: syncedInvoices.alegraInvoiceId,
      set: invoiceUpdateCols,
    });
  return invoices.length;
}

async function upsertPayments(payments: AlegraPayment[]): Promise<number> {
  const incoming = payments.filter((p) => p.type === "in");
  if (incoming.length === 0) return 0;
  await db
    .insert(syncedPayments)
    .values(incoming.map(mapPayment))
    .onConflictDoUpdate({
      target: syncedPayments.alegraPaymentId,
      set: {
        alegraClientId: sql`excluded.alegra_client_id`,
        date: sql`excluded.date`,
        amount: sql`excluded.amount`,
        invoiceIds: sql`excluded.invoice_ids`,
        bankAccount: sql`excluded.bank_account`,
        costCenter: sql`excluded.cost_center`,
        raw: sql`excluded.raw`,
        syncedAt: sql`excluded.synced_at`,
      },
    });
  return incoming.length;
}

/**
 * Sincroniza facturas y pagos de Alegra.
 * Backfill inicial por lotes con cursor persistido en sync_runs.stats
 * (retoma donde quedó si excede MAX_PAGES_PER_RUN); luego pasa a modo
 * incremental sobre una ventana móvil de INCREMENTAL_DAYS.
 */
export async function syncAlegra(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("alegra", async (runId) => {
    const prev = ((await getLastStats("alegra")) ?? {}) as AlegraCursor;
    const cursor: AlegraCursor = { ...prev };
    let invoicesSynced = 0;
    let paymentsSynced = 0;

    // 1) Facturas: backfill completo o ventana incremental por fecha.
    const invoiceParams: Record<string, string | number> = {
      order_field: "date",
      order_direction: "ASC",
    };
    if (cursor.invoicesBackfillDone) {
      invoiceParams.date_after = windowStart();
    }
    const invoiceStart = cursor.invoicesBackfillDone
      ? 0
      : (cursor.invoicesCursor ?? 0);

    for await (const page of alegraPages<AlegraInvoice>(
      "/invoices",
      invoiceParams,
      invoiceStart,
      MAX_PAGES_PER_RUN,
    )) {
      invoicesSynced += await upsertInvoices(page.items);
      if (!cursor.invoicesBackfillDone) {
        cursor.invoicesCursor = page.nextStart;
        if (page.isLast) cursor.invoicesBackfillDone = true;
        await saveRunStats(runId, { ...cursor, invoicesSynced });
      }
    }

    // 2) Pagos: sin filtro de fecha en la API → backfill con cursor y,
    //    ya completo, barrido DESC acotado (los recientes primero).
    const paymentStart = cursor.paymentsBackfillDone
      ? 0
      : (cursor.paymentsCursor ?? 0);
    const paymentPages = cursor.paymentsBackfillDone ? 5 : MAX_PAGES_PER_RUN;
    const paymentParams = cursor.paymentsBackfillDone
      ? { order_direction: "DESC" }
      : { order_direction: "ASC" };

    for await (const page of alegraPages<AlegraPayment>(
      "/payments",
      paymentParams,
      paymentStart,
      paymentPages,
    )) {
      paymentsSynced += await upsertPayments(page.items);
      if (!cursor.paymentsBackfillDone) {
        cursor.paymentsCursor = page.nextStart;
        if (page.isLast) cursor.paymentsBackfillDone = true;
        await saveRunStats(runId, { ...cursor, invoicesSynced, paymentsSynced });
      }
    }

    // 3) Snapshots diarios: cartera desde la cache + P&L/cashflow desde el
    //    backend de reportes de Alegra (fallos de reportes no tumban el sync).
    const snapshot = await upsertReceivablesSnapshot();
    const reports = await upsertReportSnapshots();

    return { ...cursor, invoicesSynced, paymentsSynced, snapshot, reports };
  });
}
