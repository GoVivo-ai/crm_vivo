import {
  describeNetworkError,
  describeStatus,
  TEST_TIMEOUT_MS,
  type ConnectionTestResult,
} from "@/integrations/shared/test-connection";
import { GRAPH_API_VERSION } from "@/integrations/meta/types";
import type { MetaAdsCredentials } from "@/modules/settings/domain/types";

/**
 * Test barato del token de Meta: GET /me/adaccounts?limit=1 (read-only,
 * criterio fijado por QA — valida token Y permiso ads_read a la vez).
 * Credenciales por parámetro; el token va en query pero nunca se
 * serializa en mensajes (solo status/cuerpo de error de Graph).
 */
export async function testMetaConnection(
  credentials: MetaAdsCredentials,
): Promise<ConnectionTestResult> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts`,
  );
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", "id,name");
  url.searchParams.set("access_token", credentials.accessToken);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Graph devuelve 400 con error.code 190 para token inválido/vencido.
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: number; message?: string };
      } | null;
      if (body?.error?.code === 190) {
        return {
          ok: false,
          message: "Token de Meta inválido o vencido; reconecta la cuenta",
        };
      }
      return {
        ok: false,
        message: describeStatus(response.status, "Meta Ads"),
      };
    }
    const body = (await response.json()) as { data?: { name?: string }[] };
    const first = body.data?.[0]?.name;
    return {
      ok: true,
      message: first
        ? `Conexión con Meta Ads verificada (cuenta: ${first})`
        : "Conexión con Meta Ads verificada (sin cuentas visibles aún)",
    };
  } catch (error) {
    return { ok: false, message: describeNetworkError(error, "Meta Ads") };
  }
}
