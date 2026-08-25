import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { accounts } from "@/modules/crm/schema";

export const adPlatformEnum = pgEnum("ad_platform", ["meta", "google_ads"]);

export const adAccounts = pgTable(
  "ad_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").references(() => accounts.id),
    platform: adPlatformEnum("platform").notNull(),
    externalAccountId: text("external_account_id").notNull(),
    name: text("name").notNull(),
    accountCurrency: text("account_currency").notNull().default("COP"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ad_accounts_platform_external_uq").on(
      table.platform,
      table.externalAccountId,
    ),
  ],
);

export const syncedCampaignMetrics = pgTable(
  "synced_campaign_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adAccountId: uuid("ad_account_id").references(() => adAccounts.id),
    platform: adPlatformEnum("platform").notNull(),
    campaignExternalId: text("campaign_external_id").notNull(),
    campaignName: text("campaign_name"),
    metricDate: date("metric_date").notNull(),
    spend: numeric("spend", { precision: 14, scale: 2 }),
    clicks: integer("clicks"),
    impressions: integer("impressions"),
    cpc: numeric("cpc", { precision: 14, scale: 4 }),
    cpm: numeric("cpm", { precision: 14, scale: 4 }),
    ctr: numeric("ctr", { precision: 10, scale: 6 }),
    reach: integer("reach"),
    frequency: numeric("frequency", { precision: 10, scale: 4 }),
    leads: integer("leads"),
    costPerLead: numeric("cost_per_lead", { precision: 14, scale: 4 }),
    purchases: integer("purchases"),
    purchaseValue: numeric("purchase_value", { precision: 14, scale: 2 }),
    // Calculado en el mapper: purchase_value / spend.
    roas: numeric("roas", { precision: 14, scale: 4 }),
    raw: jsonb("raw"),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("campaign_metrics_platform_campaign_date_uq").on(
      table.platform,
      table.campaignExternalId,
      table.metricDate,
    ),
  ],
);
