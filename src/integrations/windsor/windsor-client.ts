import { resilientFetch } from "@/shared/http/resilient-fetch";
import type { WindsorRow } from "@/integrations/windsor/types";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";

const BASE_URL = "https://connectors.windsor.ai";

/**
 * Lee métricas de un connector de Windsor.ai para un rango de fechas.
 * Devuelve filas campaña × día (validado contra el connector facebook).
 * Credenciales vía CredentialsProvider (BD cifrada, fallback a env).
 */
export async function windsorGet(
  connector: string,
  fields: string[],
  dateFrom: string,
  dateTo: string,
): Promise<WindsorRow[]> {
  const credentials = await getIntegrationCredentials("windsor");
  if (!credentials) {
    throw new Error(
      "No hay credenciales de Windsor.ai configuradas (ni en la app ni en env)",
    );
  }
  const apiKey = credentials.apiKey;
  const url = new URL(`${BASE_URL}/${connector}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("fields", fields.join(","));
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);

  const response = await resilientFetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const body = (await response.json()) as { data?: WindsorRow[] };
  return body.data ?? [];
}
