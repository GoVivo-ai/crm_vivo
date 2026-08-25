import type { syncedCampaignMetrics } from "@/modules/marketing/schema";
import type { MetaAction, MetaInsightRow } from "@/integrations/meta/types";

type MetricRow = typeof syncedCampaignMetrics.$inferInsert;

function num(value: string | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

function int(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.round(parsed);
}

/** Suma los action_types que empiecen por alguno de los prefijos. */
function sumActions(
  actions: MetaAction[] | undefined,
  prefixes: string[],
): number | null {
  if (!actions?.length) return null;
  let total = 0;
  let found = false;
  for (const action of actions) {
    if (prefixes.some((p) => action.action_type.startsWith(p))) {
      total += Number(action.value) || 0;
      found = true;
    }
  }
  return found ? total : null;
}

/**
 * Normaliza una fila de insights (campaña × día) a synced_campaign_metrics.
 * leads incluye lead forms y leads de sitio; purchases desde actions y su
 * valor desde action_values. ROAS = purchase_value / spend (no hay campo
 * directo). Devuelve null si falta la clave del upsert.
 */
export function mapInsight(
  row: MetaInsightRow,
  adAccountId: string | null,
): MetricRow | null {
  if (!row.campaign_id || !row.date_start) return null;

  const spend = row.spend ? Number(row.spend) : null;
  const leads = sumActions(row.actions, ["lead", "onsite_conversion.lead"]);
  const purchases = sumActions(row.actions, [
    "purchase",
    "omni_purchase",
    "onsite_web_purchase",
  ]);
  const purchaseValue = sumActions(row.action_values, [
    "purchase",
    "omni_purchase",
    "onsite_web_purchase",
  ]);
  const costPerLead = spend != null && leads ? spend / leads : null;
  const roas = spend && purchaseValue != null ? purchaseValue / spend : null;

  return {
    adAccountId,
    platform: "meta",
    campaignExternalId: row.campaign_id,
    campaignName: row.campaign_name ?? null,
    metricDate: row.date_start,
    spend: num(row.spend),
    clicks: int(row.clicks),
    impressions: int(row.impressions),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    ctr: num(row.ctr),
    reach: int(row.reach),
    frequency: num(row.frequency),
    leads: leads == null ? null : Math.round(leads),
    costPerLead: costPerLead == null ? null : String(costPerLead),
    purchases: purchases == null ? null : Math.round(purchases),
    purchaseValue: purchaseValue == null ? null : String(purchaseValue),
    roas: roas == null ? null : String(roas),
    raw: row,
    syncedAt: new Date(),
  };
}
