import {
  date,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { accounts } from "@/modules/crm/schema";

// Cache de Alegra. Moneda base de la app: COP; facturas EXPORT en USD
// traen su propia TRM en exchange_rate.
export const syncedInvoices = pgTable("synced_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraInvoiceId: text("alegra_invoice_id").notNull().unique(),
  numberFull: text("number_full"),
  alegraClientId: text("alegra_client_id"),
  accountId: uuid("account_id").references(() => accounts.id),
  date: date("date"),
  dueDate: date("due_date"),
  status: text("status"),
  stampLegalStatus: text("stamp_legal_status"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }),
  tax: numeric("tax", { precision: 14, scale: 2 }),
  total: numeric("total", { precision: 14, scale: 2 }),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Solo pagos type=in de Alegra.
export const syncedPayments = pgTable("synced_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraPaymentId: text("alegra_payment_id").notNull().unique(),
  alegraClientId: text("alegra_client_id"),
  accountId: uuid("account_id").references(() => accounts.id),
  date: date("date"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  // Array de {id, number, amount} asociados por Alegra.
  invoiceIds: jsonb("invoice_ids"),
  bankAccount: text("bank_account"),
  costCenter: text("cost_center"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeSnapshots = pgTable("finance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotDate: date("snapshot_date").notNull().unique(),
  pnl: jsonb("pnl"),
  cashflow: jsonb("cashflow"),
  receivables: jsonb("receivables"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
