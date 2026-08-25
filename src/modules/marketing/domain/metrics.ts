import type { MetricRates, MetricTotals } from "@/modules/marketing/domain/types";

type RawSums = {
  spend: number;
  currency: string;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchaseValue: number;
};

/** Deriva tasas de sumas crudas; null cuando el denominador es 0. */
export function computeRates(raw: RawSums): MetricRates {
  const { spend, impressions, clicks, leads, purchases, purchaseValue } = raw;
  return {
    spend,
    currency: raw.currency,
    impressions,
    clicks,
    cpc: clicks > 0 ? spend / clicks : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    ctr: impressions > 0 ? clicks / impressions : null,
    leads,
    costPerLead: leads > 0 ? spend / leads : null,
    purchases,
    purchaseValue,
    roas: spend > 0 && purchaseValue > 0 ? purchaseValue / spend : null,
  };
}

/** Suma grupos (posiblemente multi-moneda) en totales sin tasas. */
export function sumTotals(groups: RawSums[]): MetricTotals {
  const totals: MetricTotals = {
    impressions: 0,
    clicks: 0,
    leads: 0,
    purchases: 0,
    spendByCurrency: {},
    purchaseValueByCurrency: {},
  };
  for (const g of groups) {
    totals.impressions += g.impressions;
    totals.clicks += g.clicks;
    totals.leads += g.leads;
    totals.purchases += g.purchases;
    totals.spendByCurrency[g.currency] =
      (totals.spendByCurrency[g.currency] ?? 0) + g.spend;
    if (g.purchaseValue > 0) {
      totals.purchaseValueByCurrency[g.currency] =
        (totals.purchaseValueByCurrency[g.currency] ?? 0) + g.purchaseValue;
    }
  }
  return totals;
}
