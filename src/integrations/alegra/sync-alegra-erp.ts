import { sql } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncedBills } from "@/modules/purchases/schema";
import { syncedEmployees } from "@/modules/people/schema";
import {
  syncedBankAccounts,
  syncedBankTransactions,
} from "@/modules/treasury/schema";
import {
  getLastStats,
  runSync,
  saveRunStats,
  type SyncStats,
} from "@/integrations/shared/sync-run";
import { toReadableSyncError } from "@/integrations/shared/errors";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import { alegraPages, PAGE_SIZE } from "@/integrations/alegra/alegra-client";
import {
  fetchBankAccounts,
  fetchBankTransactions,
  fetchEmployees,
} from "@/integrations/alegra/erp-client";
import {
  isRealEmployee,
  mapBankAccount,
  mapBankTransaction,
  mapBill,
  mapEmployee,
} from "@/integrations/alegra/mappers-erp";
import type { AlegraBill } from "@/integrations/alegra/erp-types";

/** Presupuesto de páginas por corrida (timeout 300s del cron). */
const MAX_BILL_PAGES = 15;
const MAX_TX_PAGES_PER_RUN = 25;
const INCREMENTAL_DAYS = 60;

interface ErpCursor {
  scope?: string;
  billsCursor?: number;
  billsBackfillDone?: boolean;
  /** start por alegra_bank_id. */
  bankTxCursors?: Record<string, number>;
  bankTxBackfillDone?: Record<string, boolean>;
}

function windowStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - INCREMENTAL_DAYS);
  return d.toISOString().slice(0, 10);
}

async function upsertBills(bills: AlegraBill[]): Promise<number> {
  if (bills.length === 0) return 0;
  await db
    .insert(syncedBills)
    .values(bills.map(mapBill))
    .onConflictDoUpdate({
      target: syncedBills.alegraBillId,
      set: {
        numberFull: sql`excluded.number_full`,
        alegraProviderId: sql`excluded.alegra_provider_id`,
        providerName: sql`excluded.provider_name`,
        date: sql`excluded.date`,
        dueDate: sql`excluded.due_date`,
        status: sql`excluded.status`,
        total: sql`excluded.total`,
        totalPaid: sql`excluded.total_paid`,
        balance: sql`excluded.balance`,
        costCenter: sql`excluded.cost_center`,
        raw: sql`excluded.raw`,
        syncedAt: sql`excluded.synced_at`,
      },
    });
  return bills.length;
}

async function syncBills(cursor: ErpCursor): Promise<number> {
  const params: Record<string, string | number> = { simple: "true" };
  if (cursor.billsBackfillDone) params.date_afterOrNow = windowStart();
  const startFrom = cursor.billsBackfillDone ? 0 : (cursor.billsCursor ?? 0);

  let synced = 0;
  for await (const page of alegraPages<AlegraBill>(
    "/bills",
    params,
    startFrom,
    MAX_BILL_PAGES,
  )) {
    synced += await upsertBills(page.items);
    if (!cursor.billsBackfillDone) {
      cursor.billsCursor = page.nextStart;
      if (page.isLast) cursor.billsBackfillDone = true;
    }
  }
  return synced;
}

async function syncEmployees(): Promise<number> {
  const employees = (await fetchEmployees()).filter(isRealEmployee);
  if (employees.length === 0) return 0;
  await db
    .insert(syncedEmployees)
    .values(employees.map(mapEmployee))
    .onConflictDoUpdate({
      target: syncedEmployees.alegraEmployeeId,
      set: {
        names: sql`excluded.names`,
        lastNames: sql`excluded.last_names`,
        identification: sql`excluded.identification`,
        position: sql`excluded.position`,
        area: sql`excluded.area`,
        salary: sql`excluded.salary`,
        status: sql`excluded.status`,
        contract: sql`excluded.contract`,
        raw: sql`excluded.raw`,
        syncedAt: sql`excluded.synced_at`,
      },
    });
  return employees.length;
}

/** Cuentas + movimientos: backfill con cursor por cuenta, luego ventana. */
async function syncBanks(
  cursor: ErpCursor,
): Promise<{ accounts: number; transactions: number }> {
  const accounts = await fetchBankAccounts();
  if (accounts.length > 0) {
    await db
      .insert(syncedBankAccounts)
      .values(accounts.map(mapBankAccount))
      .onConflictDoUpdate({
        target: syncedBankAccounts.alegraBankId,
        set: {
          name: sql`excluded.name`,
          number: sql`excluded.number`,
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          balance: sql`excluded.balance`,
          mainCurrencyBalance: sql`excluded.main_currency_balance`,
          currencyCode: sql`excluded.currency_code`,
          exchangeRate: sql`excluded.exchange_rate`,
          raw: sql`excluded.raw`,
          syncedAt: sql`excluded.synced_at`,
        },
      });
  }

  cursor.bankTxCursors ??= {};
  cursor.bankTxBackfillDone ??= {};
  let transactions = 0;
  let pagesUsed = 0;

  for (const account of accounts.filter((a) => a.status === "active")) {
    const bankId = String(account.id);
    const done = cursor.bankTxBackfillDone[bankId] ?? false;
    let start = done ? 0 : (cursor.bankTxCursors[bankId] ?? 0);

    while (pagesUsed < MAX_TX_PAGES_PER_RUN) {
      await sleep(PACE_MS);
      const page = await fetchBankTransactions(bankId, start);
      pagesUsed++;
      if (page.length > 0) {
        await db
          .insert(syncedBankTransactions)
          .values(page.map((t) => mapBankTransaction(t, bankId)))
          .onConflictDoUpdate({
            target: syncedBankTransactions.alegraTransactionId,
            set: {
              date: sql`excluded.date`,
              amount: sql`excluded.amount`,
              type: sql`excluded.type`,
              status: sql`excluded.status`,
              movementType: sql`excluded.movement_type`,
              clientName: sql`excluded.client_name`,
              clientIdentification: sql`excluded.client_identification`,
              associations: sql`excluded.associations`,
              anotation: sql`excluded.anotation`,
              raw: sql`excluded.raw`,
              syncedAt: sql`excluded.synced_at`,
            },
          });
        transactions += page.length;
      }
      start += page.length;
      if (!done) cursor.bankTxCursors[bankId] = start;
      if (page.length < PAGE_SIZE) {
        if (!done) cursor.bankTxBackfillDone[bankId] = true;
        break;
      }
      // Incremental (backfill hecho): los movimientos llegan DESC-por-id
      // recientes primero, con 2 páginas basta para la ventana entre crons.
      if (done && pagesUsed >= 2) break;
    }
  }
  return { accounts: accounts.length, transactions };
}

/**
 * Sync ERP de Alegra (F6 bills, F7 employees, F8 tesorería). Corre aparte
 * del core (invoices/payments/snapshots) para aislar timeouts; comparte
 * source=alegra en sync_runs y se distingue por stats.scope="erp".
 * Cada bloque falla aislado (stats.errors).
 */
export async function syncAlegraErp(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("alegra", async (runId) => {
    const prev = ((await getLastStats("alegra", "erp")) ?? {}) as ErpCursor;
    const cursor: ErpCursor = { ...prev, scope: "erp" };
    const errors: Record<string, string> = {};
    const counts: Record<string, number> = {};

    try {
      counts.bills = await syncBills(cursor);
      await saveRunStats(runId, { ...cursor, counts });
    } catch (error) {
      errors.bills = toReadableSyncError(error);
    }

    try {
      counts.employees = await syncEmployees();
    } catch (error) {
      errors.employees = toReadableSyncError(error);
    }

    try {
      const banks = await syncBanks(cursor);
      counts.bankAccounts = banks.accounts;
      counts.bankTransactions = banks.transactions;
    } catch (error) {
      errors.banks = toReadableSyncError(error);
    }

    if (Object.keys(errors).length === 3) {
      throw new Error(`Sync ERP falló completo: ${JSON.stringify(errors)}`);
    }
    return { ...cursor, counts, errors };
  });
}
