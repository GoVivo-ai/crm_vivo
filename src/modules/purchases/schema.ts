import {
  date,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/schema";
import { recordSourceEnum } from "@/shared/database/record-source.schema";

export const expenseKindEnum = pgEnum("expense_kind", [
  "bill", // factura de proveedor a crédito (tiene due_date/balance)
  "direct", // gasto directo/pagado (en QBO: Purchase — ahí llega Chase)
]);

export const expenseStatusEnum = pgEnum("expense_status", [
  "open",
  "paid",
  "void",
]);

/**
 * Gastos — registro propio del ERP (manual editable; quickbooks solo
 * lectura, upsert por qbo_id: Bill → kind=bill, Purchase → kind=direct).
 */
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: recordSourceEnum("source").notNull().default("manual"),
  qboId: text("qbo_id").unique(),
  kind: expenseKindEnum("kind").notNull().default("direct"),
  providerName: text("provider_name").notNull(),
  /** Cuenta/tarjeta de origen del pago (gastos directos, ej. Chase). */
  paymentAccountName: text("payment_account_name"),
  costCenter: text("cost_center"),
  txnDate: date("txn_date").notNull(),
  dueDate: date("due_date"),
  status: expenseStatusEnum("status").notNull().default("paid"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  notes: text("notes"),
  raw: jsonb("raw"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
