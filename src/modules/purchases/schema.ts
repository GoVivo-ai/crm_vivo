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
// Proveedores: sin tabla propia — provider_name va desnormalizado aquí
// (decisión con Integraciones; se revisa si la UI pide directorio).

/** Facturas de proveedor (bills). */
export const syncedBills = pgTable("synced_bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraBillId: text("alegra_bill_id").notNull().unique(),
  numberFull: text("number_full"),
  alegraProviderId: text("alegra_provider_id"),
  providerName: text("provider_name"),
  date: date("date"),
  dueDate: date("due_date"),
  status: text("status"), // 'open'|'closed'|'draft'|'void'
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }),
  tax: numeric("tax", { precision: 14, scale: 2 }),
  total: numeric("total", { precision: 14, scale: 2 }),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  // Nombre del centro de costo (el id queda en raw). NO es enum: hay
  // "Gastos Administrativos", "Servicios Recurrentes", "Socios", etc.
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
  providerName: text("provider_name"),
  date: date("date"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  /** Array {id, name, total} de Alegra (Salario por Pagar, Aportes, ...).
   * Base para derivar el costo de nómina mientras payroll API no esté. */
  categories: jsonb("categories"),
  /** Array de {id, number, amount} de bills asociadas, si vienen. */
  billIds: jsonb("bill_ids"),
  bankAccount: text("bank_account"),
  costCenter: text("cost_center"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
