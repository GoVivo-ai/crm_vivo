import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { contacts } from "@/modules/crm/schema";
import type { Contact } from "@/modules/crm/domain/types";
import type { ContactInput, ListFilter } from "@/modules/crm/domain/validation";
import { toContact } from "@/modules/crm/infrastructure/mappers";

export async function listContacts(filter: ListFilter): Promise<Contact[]> {
  const conditions: SQL[] = [];
  if (filter.ownerId) conditions.push(eq(contacts.ownerId, filter.ownerId));
  if (filter.search) {
    const pattern = `%${filter.search}%`;
    conditions.push(
      or(
        ilike(contacts.name, pattern),
        ilike(contacts.email, pattern),
      ) as SQL,
    );
  }
  const rows = await db
    .select()
    .from(contacts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(contacts.createdAt))
    .limit(500);
  return rows.map(toContact);
}

export async function findContactById(id: string): Promise<Contact | null> {
  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  return rows[0] ? toContact(rows[0]) : null;
}

function toRow(input: ContactInput) {
  return {
    name: input.name,
    email: input.email || null,
    phone: input.phone,
    jobTitle: input.jobTitle,
    accountId: input.accountId ?? null,
    ownerId: input.ownerId ?? null,
    notes: input.notes ?? null,
  };
}

export async function insertContact(input: ContactInput): Promise<Contact> {
  const rows = await db.insert(contacts).values(toRow(input)).returning();
  return toContact(rows[0]);
}

export async function updateContactById(
  id: string,
  input: ContactInput,
): Promise<Contact | null> {
  const rows = await db
    .update(contacts)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();
  return rows[0] ? toContact(rows[0]) : null;
}
