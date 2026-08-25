import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { invoices } from "@/modules/finance/schema";
import { accounts } from "@/modules/crm/schema";
import type { Invoice } from "@/modules/finance/domain/types";
import type {
  InvoiceInput,
  InvoiceListFilter,
} from "@/modules/finance/domain/validation";

type Row = typeof invoices.$inferSelect;

function toInvoice(row: Row, accountName: string | null): Invoice {
  return {
    id: row.id,
    source: row.source,
    number: row.number,
    accountId: row.accountId,
    accountName,
    clientName: row.clientName,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    status: row.status,
    total: Number(row.total),
    totalPaid: Number(row.totalPaid),
    balance: Number(row.balance),
    currencyCode: row.currencyCode,
    exchangeRate: row.exchangeRate === null ? null : Number(row.exchangeRate),
    notes: row.notes,
  };
}

export async function listInvoices(
  filter: InvoiceListFilter,
): Promise<Invoice[]> {
  const conditions: SQL[] = [];
  if (filter.accountId) conditions.push(eq(invoices.accountId, filter.accountId));
  if (filter.status) conditions.push(eq(invoices.status, filter.status));
  if (filter.from) conditions.push(gte(invoices.issueDate, filter.from));
  if (filter.to) conditions.push(lte(invoices.issueDate, filter.to));
  const rows = await db
    .select({ invoice: invoices, accountName: accounts.name })
    .from(invoices)
    .leftJoin(accounts, eq(invoices.accountId, accounts.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(invoices.issueDate))
    .limit(500);
  return rows.map((r) => toInvoice(r.invoice, r.accountName));
}

export async function findInvoiceRow(id: string): Promise<Row | null> {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  return rows[0] ?? null;
}

function toRow(input: InvoiceInput, createdBy: string) {
  const balance =
    input.status === "open" ? input.total - input.totalPaid : 0;
  return {
    accountId: input.accountId ?? null,
    clientName: input.clientName ?? null,
    number: input.number ?? null,
    issueDate: input.issueDate,
    dueDate: input.dueDate ?? null,
    status: input.status,
    total: String(input.total),
    totalPaid: String(input.status === "paid" ? input.total : input.totalPaid),
    balance: String(input.status === "void" ? 0 : balance),
    currencyCode: input.currencyCode,
    exchangeRate:
      input.exchangeRate != null ? String(input.exchangeRate) : null,
    notes: input.notes ?? null,
    createdBy,
  };
}

export async function insertInvoice(
  input: InvoiceInput,
  createdBy: string,
): Promise<Invoice> {
  const rows = await db
    .insert(invoices)
    .values(toRow(input, createdBy))
    .returning();
  return toInvoice(rows[0], null);
}

/** Solo filas manuales (guard en application). */
export async function updateInvoiceById(
  id: string,
  input: InvoiceInput,
  createdBy: string,
): Promise<Invoice | null> {
  const rows = await db
    .update(invoices)
    .set({ ...toRow(input, createdBy), updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.source, "manual")))
    .returning();
  return rows[0] ? toInvoice(rows[0], null) : null;
}

export async function deleteInvoiceById(id: string): Promise<boolean> {
  const rows = await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.source, "manual")))
    .returning({ id: invoices.id });
  return rows.length > 0;
}
