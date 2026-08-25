import { and, asc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { accounts } from "@/modules/crm/schema";
import {
  adAccounts,
  syncedCampaignMetrics,
} from "@/modules/marketing/schema";
import type { AdAccountView } from "@/modules/marketing/domain/types";

export async function listAdAccountViews(): Promise<AdAccountView[]> {
  const rows = await db
    .select({
      adAccount: adAccounts,
      linkedAccountName: accounts.name,
    })
    .from(adAccounts)
    .leftJoin(accounts, eq(adAccounts.accountId, accounts.id))
    .orderBy(asc(adAccounts.platform), asc(adAccounts.name));
  return rows.map((r) => ({
    id: r.adAccount.id,
    accountId: r.adAccount.accountId,
    linkedAccountName: r.linkedAccountName ?? null,
    platform: r.adAccount.platform,
    externalAccountId: r.adAccount.externalAccountId,
    name: r.adAccount.name,
    accountCurrency: r.adAccount.accountCurrency,
    isActive: r.adAccount.isActive,
  }));
}

export async function updateAdAccountLink(
  adAccountId: string,
  accountId: string | null,
): Promise<boolean> {
  const rows = await db
    .update(adAccounts)
    .set({ accountId })
    .where(eq(adAccounts.id, adAccountId))
    .returning({ id: adAccounts.id });
  return rows.length > 0;
}

const sums = {
  spend: sql<string>`coalesce(sum(${syncedCampaignMetrics.spend}), 0)`,
  impressions: sql<number>`coalesce(sum(${syncedCampaignMetrics.impressions}), 0)::int`,
  clicks: sql<number>`coalesce(sum(${syncedCampaignMetrics.clicks}), 0)::int`,
  leads: sql<number>`coalesce(sum(${syncedCampaignMetrics.leads}), 0)::int`,
  purchases: sql<number>`coalesce(sum(${syncedCampaignMetrics.purchases}), 0)::int`,
  purchaseValue: sql<string>`coalesce(sum(${syncedCampaignMetrics.purchaseValue}), 0)`,
  currency: sql<string>`coalesce(${adAccounts.accountCurrency}, 'COP')`,
};

export type RawGroup = {
  platform: "meta" | "google_ads";
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchaseValue: number;
};

function metricFilters(range: { from: string; to: string }, accountId?: string | null) {
  const conditions: SQL[] = [
    gte(syncedCampaignMetrics.metricDate, range.from),
    lte(syncedCampaignMetrics.metricDate, range.to),
  ];
  if (accountId) conditions.push(eq(adAccounts.accountId, accountId));
  return and(...conditions);
}

/** Sumas por (plataforma, moneda) en el rango; filtro opcional por cliente. */
export async function aggregateByPlatform(
  range: { from: string; to: string },
  accountId?: string | null,
): Promise<RawGroup[]> {
  const rows = await db
    .select({
      platform: syncedCampaignMetrics.platform,
      currency: sums.currency,
      spend: sums.spend,
      impressions: sums.impressions,
      clicks: sums.clicks,
      leads: sums.leads,
      purchases: sums.purchases,
      purchaseValue: sums.purchaseValue,
    })
    .from(syncedCampaignMetrics)
    .leftJoin(adAccounts, eq(syncedCampaignMetrics.adAccountId, adAccounts.id))
    .where(metricFilters(range, accountId))
    .groupBy(syncedCampaignMetrics.platform, sums.currency);
  return rows.map((r) => ({
    ...r,
    spend: Number(r.spend),
    purchaseValue: Number(r.purchaseValue),
  }));
}

export type RawCampaignGroup = RawGroup & {
  campaignExternalId: string;
  campaignName: string | null;
  adAccountName: string | null;
};

/** Sumas por campaña en el rango, ordenadas por spend descendente. */
export async function aggregateByCampaign(
  range: { from: string; to: string },
  accountId?: string | null,
): Promise<RawCampaignGroup[]> {
  const rows = await db
    .select({
      platform: syncedCampaignMetrics.platform,
      campaignExternalId: syncedCampaignMetrics.campaignExternalId,
      campaignName: sql<string | null>`max(${syncedCampaignMetrics.campaignName})`,
      adAccountName: sql<string | null>`max(${adAccounts.name})`,
      currency: sums.currency,
      spend: sums.spend,
      impressions: sums.impressions,
      clicks: sums.clicks,
      leads: sums.leads,
      purchases: sums.purchases,
      purchaseValue: sums.purchaseValue,
    })
    .from(syncedCampaignMetrics)
    .leftJoin(adAccounts, eq(syncedCampaignMetrics.adAccountId, adAccounts.id))
    .where(metricFilters(range, accountId))
    .groupBy(
      syncedCampaignMetrics.platform,
      syncedCampaignMetrics.campaignExternalId,
      sums.currency,
    )
    .orderBy(sql`sum(${syncedCampaignMetrics.spend}) desc nulls last`)
    .limit(200);
  return rows.map((r) => ({
    ...r,
    spend: Number(r.spend),
    purchaseValue: Number(r.purchaseValue),
  }));
}
