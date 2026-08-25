import {
  boolean,
  date,
  index,
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

/** Cuentas bancarias/tarjetas — registro propio. Manual: saldo
 * actualizable a mano; QBO: current_balance del sync (solo lectura). */
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: recordSourceEnum("source").notNull().default("manual"),
  qboId: text("qbo_id").unique(),
  name: text("name").notNull(),
  type: text("type"), // 'bank' | 'cash' | 'credit-card'
  currencyCode: text("currency_code").notNull().default("COP"),
  balance: numeric("balance", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  /** TRM para consolidar a COP cuentas en otra moneda (manual). */
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  balanceUpdatedAt: timestamp("balance_updated_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const txDirectionEnum = pgEnum("tx_direction", ["in", "out"]);

/** Movimientos bancarios — registro MANUAL (QBO no expone el feed crudo
 * por API; los cargos de Chase llegan como gastos directos a expenses). */
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: recordSourceEnum("source").notNull().default("manual"),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    direction: txDirectionEnum("direction").notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bank_transactions_account_date_idx").on(
      table.bankAccountId,
      table.date,
    ),
  ],
);
