import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accounts } from "@/modules/crm/schema";
import type { Account } from "@/modules/crm/domain/types";
import type { AccountInput, ListFilter } from "@/modules/crm/domain/validation";
import { toAccount } from "@/modules/crm/infrastructure/mappers";

export async function listAccounts(filter: ListFilter): Promise<Account[]> {
  const conditions: SQL[] = [];
  if (filter.ownerId) conditions.push(eq(accounts.ownerId, filter.ownerId));
  if (filter.search) {
    conditions.push(ilike(accounts.name, `%${filter.search}%`) as SQL);
  }
  const rows = await db
    .select()
    .from(accounts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(accounts.createdAt))
    .limit(500);
  return rows.map(toAccount);
}

export async function findAccountById(id: string): Promise<Account | null> {
  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return rows[0] ? toAccount(rows[0]) : null;
}

function toRow(input: AccountInput) {
  return {
    name: input.name,
    nit: input.nit,
    industry: input.industry,
    website: input.website,
    status: input.status,
    ownerId: input.ownerId ?? null,
    alegraContactId: input.alegraContactId,
    clickupFolderId: input.clickupFolderId,
    notes: input.notes ?? null,
  };
}

export async function insertAccount(input: AccountInput): Promise<Account> {
  const rows = await db.insert(accounts).values(toRow(input)).returning();
  return toAccount(rows[0]);
}

export async function updateAccountById(
  id: string,
  input: AccountInput,
): Promise<Account | null> {
  const rows = await db
    .update(accounts)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning();
  return rows[0] ? toAccount(rows[0]) : null;
}

export async function setAccountStatus(
  id: string,
  status: Account["status"],
): Promise<void> {
  await db
    .update(accounts)
    .set({ status, updatedAt: new Date() })
    .where(eq(accounts.id, id));
}
