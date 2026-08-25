import {
  describeNetworkError,
  describeStatus,
  TEST_TIMEOUT_MS,
  type ConnectionTestResult,
} from "@/integrations/shared/test-connection";

import type { WindsorCredentials } from "@/modules/settings/domain/types";

/**
 * Test barato de la API key de Windsor.ai: query mínima de 1 día y 1 campo
 * al connector facebook. Windsor puede devolver 200 con un cuerpo de error,
 * así que se valida también el JSON. Credenciales por parámetro.
 */
export async function testWindsorConnection(
  credentials: WindsorCredentials,
): Promise<ConnectionTestResult> {
  const today = new Date().toISOString().slice(0, 10);
  const url = new URL("https://connectors.windsor.ai/facebook");
  url.searchParams.set("api_key", credentials.apiKey);
  url.searchParams.set("fields", "account_name");
  url.searchParams.set("date_from", today);
  url.searchParams.set("date_to", today);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: describeStatus(response.status, "Windsor.ai"),
      };
    }
    const body = (await response.json()) as {
      data?: unknown[];
      error?: string;
      message?: string;
    };
    if (!Array.isArray(body.data)) {
      const detail = body.error ?? body.message;
      return {
        ok: false,
        message: detail
          ? `Windsor.ai rechazó la API key: ${detail}`
          : "Windsor.ai respondió sin datos; revisa la API key",
      };
    }
    return { ok: true, message: "Conexión con Windsor.ai verificada" };
  } catch (error) {
    return { ok: false, message: describeNetworkError(error, "Windsor.ai") };
  }
}
