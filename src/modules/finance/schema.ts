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
import { accounts } from "@/modules/crm/schema";
import { users } from "@/modules/identity/schema";
import { recordSourceEnum } from "@/shared/database/record-source.schema";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "open",
  "paid",
  "void",
]);

/**
 * Facturas de ingreso — registro propio del ERP. source='manual' se
 * edita/borra en la app; source='quickbooks' es solo lectura (upsert por
 * qbo_id del sync). Moneda base COP; otras monedas con su TRM.
 */
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: recordSourceEnum("source").notNull().default("manual"),
  qboId: text("qbo_id").unique(),
  number: text("number"),
  accountId: uuid("account_id").references(() => accounts.id),
  /** Nombre del cliente cuando no hay cuenta CRM vinculada. */
  clientName: text("client_name"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  status: invoiceStatusEnum("status").notNull().default("open"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
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
