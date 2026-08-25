export type AdPlatform = "meta" | "google_ads";

/** Fila cruda de Windsor.ai: una campaña × día. Campos opcionales según connector. */
export interface WindsorRow {
  account_id?: string;
  account_name?: string;
  account_currency?: string;
  campaign?: string;
  campaign_id?: string;
  date?: string;
  spend?: number;
  clicks?: number;
  impressions?: number;
  cpc?: number;
  cpm?: number;
  ctr?: number;
  reach?: number;
  frequency?: number;
  // Meta (facebook)
  actions_lead?: number;
  cost_per_action_type_lead?: number;
  actions_purchase?: number;
  action_values_purchase?: number;
  // Google Ads
  conversions?: number;
  conversion_value?: number;
}

export interface WindsorConnectorConfig {
  /** Slug de Windsor: "facebook", "google_ads". */
  connector: string;
  platform: AdPlatform;
  fields: string[];
}

const COMMON_FIELDS = [
  "account_id",
  "account_name",
  "account_currency",
  "campaign",
  "campaign_id",
  "date",
  "spend",
  "clicks",
  "impressions",
  "cpc",
  "cpm",
  "ctr",
];

// Campos validados contra la API real de Windsor (connector facebook).
// Los de google_ads siguen la convención de Windsor; si el connector
// rechaza alguno, ese sync falla aislado y queda registrado en sync_runs.
export const WINDSOR_CONNECTORS: WindsorConnectorConfig[] = [
  {
    connector: "facebook",
    platform: "meta",
    fields: [
      ...COMMON_FIELDS,
      "reach",
      "frequency",
      "actions_lead",
      "cost_per_action_type_lead",
      "actions_purchase",
      "action_values_purchase",
    ],
  },
  {
    connector: "google_ads",
    platform: "google_ads",
    fields: [...COMMON_FIELDS, "conversions", "conversion_value"],
  },
];
