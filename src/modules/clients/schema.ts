import {
  boolean,
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

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  defaultMonthlyFee: numeric("default_monthly_fee", {
    precision: 14,
    scale: 2,
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accountServices = pgTable("account_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id),
  monthlyFee: numeric("monthly_fee", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("COP"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectHealthEnum = pgEnum("project_health", [
  "green",
  "yellow",
  "red",
  "unknown",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  clickupListId: text("clickup_list_id").unique(),
  health: projectHealthEnum("health").notNull().default("unknown"),
  syncedProgress: jsonb("synced_progress"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
