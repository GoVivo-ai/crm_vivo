/** Versión de la Graph API de Meta (subir con calma: ~2 años de vida cada una). */
export const GRAPH_API_VERSION = "v23.0";

export interface MetaAdAccount {
  /** "act_123..." */
  id: string;
  account_id: string;
  name: string;
  currency: string;
}

export interface MetaAction {
  action_type: string;
  value: string;
}

/** Fila de /act_X/insights?level=campaign&time_increment=1. */
export interface MetaInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  date_start?: string;
  date_stop?: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  reach?: string;
  frequency?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
}

export interface MetaPage<T> {
  data: T[];
  paging?: { next?: string };
}
