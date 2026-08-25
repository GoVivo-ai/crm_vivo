import { sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { invoices } from "@/modules/finance/schema";
import { expenses } from "@/modules/purchases/schema";
import { bankAccounts } from "@/modules/treasury/schema";
import {
  getLastStats,
  runSync,
  type SyncStats,
} from "@/integrations/shared/sync-run";
import { toReadableSyncError } from "@/integrations/shared/errors";
import { qboQueryAll } from "@/integrations/quickbooks/qbo-client";
import {
  mapQboAccount,
  mapQboBill,
  mapQboInvoice,
  mapQboPurchase,
} from "@/integrations/quickbooks/mappers";
import type {
  QboAccount,
  QboBill,
  QboInvoice,
  QboPurchase,
} from "@/integrations/quickbooks/types";

/** Solape del incremental para no perder escrituras concurrentes. */
const OVERLAP_MINUTES = 10;

interface QboCursor {
  /** ISO del último sync exitoso (estilo CDC con MetaData.LastUpdatedTime). */
  lastSyncedAt?: string;
}

function incrementalWhere(cursor: QboCursor): string {
  if (!cursor.lastSyncedAt) return "";
  const since = new Date(
    new Date(cursor.lastSyncedAt).getTime() - OVERLAP_MINUTES * 60_000,
  ).toISOString();
  return `WHERE MetaData.LastUpdatedTime > '${since}'`;
}

async function upsertBatch<T extends { qboId?: string | null }>(
  table: typeof invoices | typeof expenses | typeof bankAccounts,
  rows: T[],
  updateCols: Record<string, unknown>,
): Promise<number> {
  if (rows.length === 0) return 0;
  for (let i = 0; i < rows.length; i += 100) {
    await db
      .insert(table)
      .values(rows.slice(i, i + 100) as never)
      .onConflictDoUpdate({
        target: table.qboId,
        set: updateCols as never,
      });
  }
  return rows.length;
}

/** Vincula facturas QBO a cuentas CRM por accounts.billing_customer_id. */
async function linkInvoicesToAccounts(): Promise<void> {
  await db.execute(sql`
    UPDATE invoices SET account_id = a.id
    FROM accounts a
    WHERE invoices.account_id IS NULL
      AND invoices.source = 'quickbooks'
      AND a.billing_customer_id = invoices.raw -> 'CustomerRef' ->> 'value'
  `);
}

/**
 * Sync QuickBooks Online: Invoice → invoices, Bill/Purchase → expenses,
 * Account (Bank/Credit Card, ahí aparece Chase) → bank_accounts. Todas
 * tablas unificadas con source='quickbooks' y upsert por qbo_id.
 * Incremental por MetaData.LastUpdatedTime con cursor en sync_runs.stats;
 * cada entidad falla aislada (stats.errors).
 */
export async function syncQuickbooks(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("quickbooks", async () => {
    const prev = ((await getLastStats("quickbooks")) ?? {}) as QboCursor;
    const startedAt = new Date().toISOString();
    const where = incrementalWhere(prev);
    const counts: Record<string, number> = {};
    const errors: Record<string, string> = {};

    try {
      const rows = await qboQueryAll<QboInvoice>("Invoice", where);
      counts.invoices = await upsertBatch(
        invoices,
        rows.map(mapQboInvoice).filter((r) => r !== null),
        {
          number: sql`excluded.number`,
          clientName: sql`excluded.client_name`,
          issueDate: sql`excluded.issue_date`,
          dueDate: sql`excluded.due_date`,
          status: sql`excluded.status`,
          total: sql`excluded.total`,
          totalPaid: sql`excluded.total_paid`,
          balance: sql`excluded.balance`,
          currencyCode: sql`excluded.currency_code`,
          exchangeRate: sql`excluded.exchange_rate`,
          raw: sql`excluded.raw`,
        },
      );
      await linkInvoicesToAccounts();
    } catch (error) {
      errors.invoices = toReadableSyncError(error);
    }

    try {
      const bills = await qboQueryAll<QboBill>("Bill", where);
      const purchases = await qboQueryAll<QboPurchase>("Purchase", where);
      counts.expenses = await upsertBatch(
        expenses,
        [
          ...bills.map(mapQboBill),
          ...purchases.map(mapQboPurchase),
        ].filter((r) => r !== null),
        {
          kind: sql`excluded.kind`,
          providerName: sql`excluded.provider_name`,
          paymentAccountName: sql`excluded.payment_account_name`,
          txnDate: sql`excluded.txn_date`,
          dueDate: sql`excluded.due_date`,
          status: sql`excluded.status`,
          total: sql`excluded.total`,
          balance: sql`excluded.balance`,
          currencyCode: sql`excluded.currency_code`,
          raw: sql`excluded.raw`,
        },
      );
    } catch (error) {
      errors.expenses = toReadableSyncError(error);
    }

    try {
      // Los saldos siempre completos (no incremental: son estado, no eventos).
      const accounts = await qboQueryAll<QboAccount>(
        "Account",
        "WHERE AccountType IN ('Bank', 'Credit Card')",
      );
      counts.bankAccounts = await upsertBatch(
        bankAccounts,
        accounts.map(mapQboAccount),
        {
          name: sql`excluded.name`,
          type: sql`excluded.type`,
          balance: sql`excluded.balance`,
          currencyCode: sql`excluded.currency_code`,
          balanceUpdatedAt: sql`excluded.balance_updated_at`,
          isActive: sql`excluded.is_active`,
          raw: sql`excluded.raw`,
        },
      );
    } catch (error) {
      errors.bankAccounts = toReadableSyncError(error);
    }

    if (Object.keys(errors).length === 3) {
      throw new Error(`Sync QBO falló completo: ${JSON.stringify(errors)}`);
    }
    // El cursor solo avanza si todo salió bien; si algo falló se reintenta
    // desde el cursor anterior en la próxima corrida.
    const lastSyncedAt =
      Object.keys(errors).length === 0 ? startedAt : prev.lastSyncedAt;
    const rowsProcessed = Object.values(counts).reduce((a, b) => a + b, 0);
    return { lastSyncedAt, rowsProcessed, counts, errors };
  });
}
