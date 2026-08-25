import { resilientFetch } from "@/shared/http/resilient-fetch";
import { PACE_MS, sleep } from "@/integrations/shared/paced";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";

const BASE_URL = "https://api.alegra.com/api/v1";

/** Alegra pagina con start/limit; 30 es el máximo permitido. */
export const PAGE_SIZE = 30;

/**
 * Basic Auth desde el CredentialsProvider (BD cifrada con fallback a env).
 * Se resuelve en cada corrida: rotación de credenciales sin redeploy.
 * Compartido con reports-client.
 */
export async function alegraAuthHeader(): Promise<string> {
  const credentials = await getIntegrationCredentials("alegra");
  if (!credentials) {
    throw new Error(
      "No hay credenciales de Alegra configuradas (ni en la app ni en env)",
    );
  }
  return `Basic ${Buffer.from(
    `${credentials.email}:${credentials.token}`,
  ).toString("base64")}`;
}

export async function alegraGet<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await resilientFetch(url.toString(), {
    headers: {
      Authorization: await alegraAuthHeader(),
      Accept: "application/json",
    },
  });
  return (await response.json()) as T;
}

export interface AlegraPage<T> {
  items: T[];
  /** start de la SIGUIENTE página (cursor a persistir). */
  nextStart: number;
  isLast: boolean;
}

/**
 * Itera páginas secuencialmente (nunca Promise.all: rate limit de Alegra),
 * con pausa entre requests. `maxPages` acota el trabajo por ejecución para
 * que el backfill quepa en el timeout del cron; el cursor lo persiste el
 * llamador con `nextStart`.
 */
export async function* alegraPages<T>(
  path: string,
  params: Record<string, string | number>,
  startFrom: number,
  maxPages: number,
): AsyncGenerator<AlegraPage<T>> {
  let start = startFrom;
  for (let page = 0; page < maxPages; page++) {
    if (page > 0) await sleep(PACE_MS);
    const items = await alegraGet<T[]>(path, {
      ...params,
      start,
      limit: PAGE_SIZE,
    });
    start += items.length;
    const isLast = items.length < PAGE_SIZE;
    yield { items, nextStart: start, isLast };
    if (isLast) return;
  }
}
