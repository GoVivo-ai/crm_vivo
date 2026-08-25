import {
  date,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Cache de Alegra — Gastos y compras (Fase 6). Moneda base COP; los
// documentos en otra moneda traen su TRM en exchange_rate.

/** Contactos de Alegra tipo provider. */
export const syncedProviders = pgTable("synced_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraContactId: text("alegra_contact_id").notNull().unique(),
  name: text("name").notNull(),
  nit: text("nit"),
  email: text("email"),
  phone: text("phone"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Facturas de proveedor (bills). */
export const syncedBills = pgTable("synced_bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraBillId: text("alegra_bill_id").notNull().unique(),
  numberFull: text("number_full"),
  alegraProviderId: text("alegra_provider_id"),
  providerName: text("provider_name"),
  date: date("date"),
  dueDate: date("due_date"),
  status: text("status"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }),
  tax: numeric("tax", { precision: 14, scale: 2 }),
  total: numeric("total", { precision: 14, scale: 2 }),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  costCenter: text("cost_center"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Pagos salientes de Alegra (payments type=out). */
export const syncedSupplierPayments = pgTable("synced_supplier_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraPaymentId: text("alegra_payment_id").notNull().unique(),
  alegraProviderId: text("alegra_provider_id"),
  date: date("date"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  /** Array de {id, number, amount} de bills asociadas por Alegra. */
  billIds: jsonb("bill_ids"),
  bankAccount: text("bank_account"),
  costCenter: text("cost_center"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
