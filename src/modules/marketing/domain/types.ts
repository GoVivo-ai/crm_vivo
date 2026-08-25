// Tipos de dominio de Marketing/Ads. El spend se expone en la moneda de
// cada cuenta publicitaria (account_currency), SIN convertir a COP: no hay
// TRM diaria; frontend formatea multi-moneda. Métrica principal B2B:
// leads / costPerLead (ROAS solo cuando hay purchase values).

export type AdPlatform = "meta" | "google_ads";

export type AdAccountView = {
  id: string;
  /** Cuenta CRM (cliente) vinculada, o null si está pendiente de vincular. */
  accountId: string | null;
  linkedAccountName: string | null;
  platform: AdPlatform;
  externalAccountId: string;
  name: string;
  accountCurrency: string;
  isActive: boolean;
};

/** Métricas agregadas con tasas derivadas; las tasas son null si el
 * denominador es 0 (ej. sin clicks → cpc null). */
export type MetricRates = {
  spend: number;
  currency: string;
  impressions: number;
  clicks: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  leads: number;
  costPerLead: number | null;
  purchases: number;
  purchaseValue: number;
  roas: number | null;
};

/** Totales sin tasas: cruzan monedas, así que solo sumas por moneda. */
export type MetricTotals = {
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  spendByCurrency: Record<string, number>;
  purchaseValueByCurrency: Record<string, number>;
};

export type PlatformMetrics = MetricRates & { platform: AdPlatform };

export type CampaignMetrics = MetricRates & {
  platform: AdPlatform;
  campaignExternalId: string;
  campaignName: string | null;
  adAccountName: string | null;
};

export type MarketingDashboard = {
  period: { from: string; to: string };
  previousPeriod: { from: string; to: string };
  totals: MetricTotals;
  /** Totales del periodo anterior de igual longitud, para comparativas. */
  previousTotals: MetricTotals;
  /** Agrupado por (plataforma, moneda) — tasas válidas dentro del grupo. */
  byPlatform: PlatformMetrics[];
  byCampaign: CampaignMetrics[];
};
