import { resilientFetch } from "@/shared/http/resilient-fetch";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";
import type { QboQueryResponse } from "@/integrations/quickbooks/types";

// Producción vs sandbox de Intuit: mismo contrato, host distinto.
const PROD_URL = "https://quickbooks.api.intuit.com";
const SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com";
const MINOR_VERSION = "75";
/** Máximo de la API QBO por página de query. */
export const QBO_PAGE_SIZE = 1000;
const MAX_QUERY_PAGES = 20;

function baseUrl(): string {
  return process.env.QBO_USE_SANDBOX === "true" ? SANDBOX_URL : PROD_URL;
}

async function credentials(): Promise<{ token: string; realmId: string }> {
  const payload = await getIntegrationCredentials("quickbooks");
  if (!payload?.accessToken || !payload.realmId) {
    throw new Error(
      "No hay conexión con QuickBooks configurada (conéctala en Ajustes)",
    );
  }
  return { token: payload.accessToken, realmId: payload.realmId };
}

/** GET autenticado contra /v3/company/{realmId}/{path}. Token en header
 * Bearer (nunca en URL) y URLs sanitizadas por HttpError: cero fugas. */
export async function qboGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const { token, realmId } = await credentials();
  const url = new URL(`${baseUrl()}/v3/company/${realmId}/${path}`);
  url.searchParams.set("minorversion", MINOR_VERSION);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await resilientFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return (await response.json()) as T;
}

/**
 * Query paginada (STARTPOSITION/MAXRESULTS) de una entidad, secuencial.
 * `where` opcional, ej. "WHERE MetaData.LastUpdatedTime > '2026-08-01'"
 * para incrementales tipo CDC.
 */
export async function qboQueryAll<T>(
  entity: string,
  where = "",
): Promise<T[]> {
  const rows: T[] = [];
  let start = 1;
  for (let page = 0; page < MAX_QUERY_PAGES; page++) {
    if (page > 0) await sleep(PACE_MS);
    const query = `SELECT * FROM ${entity} ${where} STARTPOSITION ${start} MAXRESULTS ${QBO_PAGE_SIZE}`.trim();
    const body = await qboGet<QboQueryResponse<string, T>>("query", { query });
    const batch = (body.QueryResponse[entity] ?? []) as T[];
    rows.push(...batch);
    if (batch.length < QBO_PAGE_SIZE) break;
    start += batch.length;
  }
  return rows;
}
