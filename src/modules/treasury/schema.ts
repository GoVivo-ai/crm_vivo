import {
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Tesorería (Fase 8) — cache de Alegra Banks.

export const syncedBankAccounts = pgTable("synced_bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  alegraBankId: text("alegra_bank_id").notNull().unique(),
  name: text("name").notNull(),
  number: text("number"),
  type: text("type"), // 'bank'|'cash'|'credit-card'
  status: text("status"),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  /** Saldo YA normalizado a COP por Alegra — usar para la posición
   * consolidada. */
  mainCurrencyBalance: numeric("main_currency_balance", {
    precision: 14,
    scale: 2,
  }),
  currencyCode: text("currency_code").notNull().default("COP"),
  exchangeRate: numeric("exchange_rate", { precision: 14, scale: 4 }),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const syncedBankTransactions = pgTable(
  "synced_bank_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alegraTransactionId: text("alegra_transaction_id").notNull().unique(),
    /** FK lógica a synced_bank_accounts.alegra_bank_id. */
    alegraBankId: text("alegra_bank_id").notNull(),
    date: date("date"),
    amount: numeric("amount", { precision: 14, scale: 2 }),
    type: text("type"), // 'in'|'out'
    status: text("status"),
    movementType: text("movement_type"),
    clientName: text("client_name"),
    clientIdentification: text("client_identification"),
    /** Texto legible de Alegra, ej. "Facturas: FE10399". */
    associations: text("associations"),
    anotation: text("anotation"),
    raw: jsonb("raw"),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Backfill con cursor por cuenta (~1.350 movimientos en la principal).
    index("bank_transactions_bank_date_idx").on(
      table.alegraBankId,
      table.date,
    ),
  ],
);
