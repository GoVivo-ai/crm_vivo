import { resilientFetch } from "@/shared/http/resilient-fetch";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";
import {
  GRAPH_API_VERSION,
  type MetaAdAccount,
  type MetaInsightRow,
  type MetaPage,
} from "@/integrations/meta/types";

const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
/** Tope de páginas por request de insights (paging.next). */
const MAX_PAGES = 20;

const INSIGHT_FIELDS = [
  "campaign_id",
  "campaign_name",
  "spend",
  "clicks",
  "impressions",
  "cpc",
  "cpm",
  "ctr",
  "reach",
  "frequency",
  "actions",
  "action_values",
].join(",");

async function accessToken(): Promise<string> {
  const credentials = await getIntegrationCredentials("meta_ads");
  if (!credentials) {
    throw new Error(
      "No hay credenciales de Meta Ads configuradas (ni en la app ni en env)",
    );
  }
  return credentials.accessToken;
}

// El token viaja como query param access_token: sanitizeUrl de HttpError
// recorta la query, así que nunca llega a mensajes de error ni sync_runs.
async function graphGet<T>(url: URL | string): Promise<T> {
  const response = await resilientFetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  return (await response.json()) as T;
}

/** Cuentas publicitarias visibles para el system user del token. */
export async function fetchAdAccounts(): Promise<MetaAdAccount[]> {
  const url = new URL(`${BASE_URL}/me/adaccounts`);
  url.searchParams.set("fields", "id,account_id,name,currency");
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", await accessToken());
  const body = await graphGet<MetaPage<MetaAdAccount>>(url);
  return body.data ?? [];
}

/**
 * Insights por campaña × día de una cuenta (time_increment=1), siguiendo
 * paging.next secuencialmente. paging.next ya incluye el access_token.
 */
export async function fetchCampaignInsights(
  accountId: string,
  since: string,
  until: string,
): Promise<MetaInsightRow[]> {
  const url = new URL(`${BASE_URL}/act_${accountId}/insights`);
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("fields", INSIGHT_FIELDS);
  url.searchParams.set("limit", "500");
  url.searchParams.set("access_token", await accessToken());

  const rows: MetaInsightRow[] = [];
  let next: string | undefined = url.toString();
  for (let page = 0; next && page < MAX_PAGES; page++) {
    if (page > 0) await sleep(PACE_MS);
    const body: MetaPage<MetaInsightRow> =
      await graphGet<MetaPage<MetaInsightRow>>(next);
    rows.push(...(body.data ?? []));
    next = body.paging?.next;
  }
  return rows;
}
