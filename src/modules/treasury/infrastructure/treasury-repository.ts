import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import {
  syncedBankAccounts,
  syncedBankTransactions,
} from "@/modules/treasury/schema";
import type {
  BankAccountView,
  BankTransactionView,
} from "@/modules/treasury/domain/types";

const toNumber = (v: string | null) => (v === null ? null : Number(v));

export async function listBankAccounts(): Promise<BankAccountView[]> {
  const rows = await db
    .select()
    .from(syncedBankAccounts)
    .orderBy(asc(syncedBankAccounts.name));
  return rows.map((r) => ({
    id: r.id,
    alegraBankId: r.alegraBankId,
    name: r.name,
    number: r.number,
    type: r.type,
    status: r.status,
    balance: toNumber(r.balance),
    currencyCode: r.currencyCode,
    balanceCop: toNumber(r.mainCurrencyBalance),
    syncedAt: r.syncedAt,
  }));
}

export async function listRecentTransactions(
  limit: number,
): Promise<BankTransactionView[]> {
  const rows = await db
    .select({
      tx: syncedBankTransactions,
      bankName: syncedBankAccounts.name,
    })
    .from(syncedBankTransactions)
    .leftJoin(
      syncedBankAccounts,
      eq(syncedBankTransactions.alegraBankId, syncedBankAccounts.alegraBankId),
    )
    .orderBy(desc(syncedBankTransactions.date))
    .limit(limit);
  return rows.map(({ tx, bankName }) => ({
    id: tx.id,
    alegraBankId: tx.alegraBankId,
    bankName: bankName ?? null,
    date: tx.date,
    amount: toNumber(tx.amount),
    type: tx.type,
    movementType: tx.movementType,
    clientName: tx.clientName,
    associations: tx.associations,
    anotation: tx.anotation,
  }));
}
