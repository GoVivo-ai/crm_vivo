import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/schema";

export const accountStatusEnum = pgEnum("account_status", [
  "prospect",
  "active",
  "paused",
  "churned",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nit: text("nit"),
  industry: text("industry"),
  website: text("website"),
  status: accountStatusEnum("status").notNull().default("prospect"),
  ownerId: uuid("owner_id").references(() => users.id),
  /** Id del cliente en la fuente de facturación conectada (hoy QBO
   * Customer.Id) — matcheo genérico cliente↔fuente. */
  billingCustomerId: text("billing_customer_id").unique(),
  clickupFolderId: text("clickup_folder_id").unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  accountId: uuid("account_id").references(() => accounts.id),
  ownerId: uuid("owner_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  position: integer("position").notNull(),
  probability: integer("probability").notNull().default(0),
  isWon: boolean("is_won").notNull().default(false),
  isLost: boolean("is_lost").notNull().default(false),
});

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  stageId: uuid("stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  ownerId: uuid("owner_id").references(() => users.id),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  currency: text("currency").notNull().default("COP"),
  expectedCloseDate: date("expected_close_date"),
  position: integer("position").notNull().default(0),
  // Para "días en etapa" del Kanban; se resetea al mover de etapa.
  stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
]);

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id),
  title: text("title").notNull(),
  url: text("url"),
  status: proposalStatusEnum("status").notNull().default("draft"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "meeting",
  "email",
  "task",
  "note",
]);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: activityTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    content: text("content"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dealId: uuid("deal_id").references(() => deals.id),
    contactId: uuid("contact_id").references(() => contacts.id),
    accountId: uuid("account_id").references(() => accounts.id),
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "activities_target_check",
      sql`${table.dealId} IS NOT NULL OR ${table.contactId} IS NOT NULL OR ${table.accountId} IS NOT NULL`,
    ),
  ],
);

/** Historial de transiciones de etapa — un evento por movimiento real
 * (el timeline del negocio pinta la historia completa). */
export const dealStageEvents = pgTable("deal_stage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  fromStageId: uuid("from_stage_id").references(() => pipelineStages.id),
  toStageId: uuid("to_stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  movedBy: uuid("moved_by").references(() => users.id),
  movedAt: timestamp("moved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
