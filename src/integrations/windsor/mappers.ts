import type { syncedCampaignMetrics } from "@/modules/marketing/schema";
import type { AdPlatform, WindsorRow } from "@/integrations/windsor/types";

type MetricRow = typeof syncedCampaignMetrics.$inferInsert;

function num(value: number | undefined | null): string | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return String(value);
}

function int(value: number | undefined | null): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return Math.round(value);
}

/**
 * Normaliza una fila de Windsor a synced_campaign_metrics.
 * - Meta: leads/purchases vienen de actions_*; ROAS = action_values_purchase/spend.
 * - Google Ads: conversions ≈ leads (clientes B2B); conversion_value → purchase_value.
 * Devuelve null si falta la clave del upsert (campaign_id o date).
 */
export function mapMetricRow(
  row: WindsorRow,
  platform: AdPlatform,
  adAccountId: string | null,
): MetricRow | null {
  if (!row.campaign_id || !row.date) return null;

  const spend = row.spend ?? null;
  const leads = platform === "meta" ? row.actions_lead : row.conversions;
  const purchaseValue =
    platform === "meta" ? row.action_values_purchase : row.conversion_value;
  const purchases = platform === "meta" ? row.actions_purchase : null;

  const costPerLead =
    platform === "meta"
      ? row.cost_per_action_type_lead
      : spend != null && leads ? spend / leads : null;
  const roas = spend && purchaseValue != null ? purchaseValue / spend : null;

  return {
    adAccountId,
    platform,
    campaignExternalId: row.campaign_id,
    campaignName: row.campaign ?? null,
    metricDate: row.date,
    spend: num(spend),
    clicks: int(row.clicks),
    impressions: int(row.impressions),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    ctr: num(row.ctr),
    reach: int(row.reach),
    frequency: num(row.frequency),
    leads: int(leads),
    costPerLead: num(costPerLead),
    purchases: int(purchases),
    purchaseValue: num(purchaseValue),
    roas: num(roas),
    raw: row,
    syncedAt: new Date(),
  };
}
