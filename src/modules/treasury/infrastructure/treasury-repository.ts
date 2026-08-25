import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import {
  bankAccounts,
  bankTransactions,
} from "@/modules/treasury/schema";
import type {
  BankAccountView,
  BankTransactionView,
} from "@/modules/treasury/domain/types";
import type {
  BankAccountInput,
  BankTransactionInput,
} from "@/modules/treasury/domain/validation";

const toNumber = (v: string | null) => (v === null ? null : Number(v));

type AccountRow = typeof bankAccounts.$inferSelect;

export function toAccountView(row: AccountRow): BankAccountView {
  const balance = Number(row.balance);
  return {
    id: row.id,
    source: row.source,
    name: row.name,
    type: row.type,
    currencyCode: row.currencyCode,
    balance,
    balanceCop: balance * (toNumber(row.exchangeRate) ?? 1),
    balanceUpdatedAt: row.balanceUpdatedAt,
    isActive: row.isActive,
  };
}

export async function listBankAccounts(): Promise<BankAccountView[]> {
  const rows = await db
    .select()
    .from(bankAccounts)
    .orderBy(asc(bankAccounts.name));
  return rows.map(toAccountView);
}

export async function findBankAccountRow(id: string): Promise<AccountRow | null> {
  const rows = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertBankAccount(
  input: BankAccountInput,
): Promise<BankAccountView> {
  const rows = await db
    .insert(bankAccounts)
    .values({
      name: input.name,
      type: input.type ?? null,
      currencyCode: input.currencyCode,
      balance: String(input.balance),
      exchangeRate:
        input.exchangeRate != null ? String(input.exchangeRate) : null,
      balanceUpdatedAt: new Date(),
      isActive: input.isActive,
    })
    .returning();
  return toAccountView(rows[0]);
}

/** Solo cuentas manuales (guard en application). */
export async function updateBankAccountById(
  id: string,
  input: BankAccountInput,
): Promise<BankAccountView | null> {
  const rows = await db
    .update(bankAccounts)
    .set({
      name: input.name,
      type: input.type ?? null,
      currencyCode: input.currencyCode,
      balance: String(input.balance),
      exchangeRate:
        input.exchangeRate != null ? String(input.exchangeRate) : null,
      balanceUpdatedAt: new Date(),
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, id))
    .returning();
  return rows[0] ? toAccountView(rows[0]) : null;
}

export async function listRecentTransactions(
  limit: number,
): Promise<BankTransactionView[]> {
  const rows = await db
    .select({ tx: bankTransactions, bankName: bankAccounts.name })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .orderBy(desc(bankTransactions.date))
    .limit(limit);
  return rows.map(({ tx, bankName }) => ({
    id: tx.id,
    bankAccountId: tx.bankAccountId,
    bankName,
    date: tx.date,
    amount: Number(tx.amount),
    direction: tx.direction,
    description: tx.description,
  }));
}

export async function insertTransaction(
  input: BankTransactionInput,
  createdBy: string,
): Promise<BankTransactionView> {
  const rows = await db
    .insert(bankTransactions)
    .values({
      bankAccountId: input.bankAccountId,
      date: input.date,
      amount: String(input.amount),
      direction: input.direction,
      description: input.description ?? null,
      createdBy,
    })
    .returning();
  const row = rows[0];
  return {
    id: row.id,
    bankAccountId: row.bankAccountId,
    bankName: null,
    date: row.date,
    amount: Number(row.amount),
    direction: row.direction,
    description: row.description,
  };
}

export async function deleteTransactionById(id: string): Promise<boolean> {
  const rows = await db
    .delete(bankTransactions)
    .where(eq(bankTransactions.id, id))
    .returning({ id: bankTransactions.id });
  return rows.length > 0;
}
