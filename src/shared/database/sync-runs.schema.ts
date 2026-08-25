import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const syncSourceEnum = pgEnum("sync_source", [
  "quickbooks",
  "clickup",
  "meta_ads",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "running",
  "success",
  "error",
]);

// Observabilidad de los crons de sincronización.
export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: syncSourceEnum("source").notNull(),
  status: syncStatusEnum("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  error: text("error"),
  stats: jsonb("stats"),
});
