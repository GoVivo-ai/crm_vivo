import {
  describeNetworkError,
  describeStatus,
  TEST_TIMEOUT_MS,
  type ConnectionTestResult,
} from "@/integrations/shared/test-connection";

export interface AlegraCredentials {
  email: string;
  apiToken: string;
}

/**
 * Test barato de credenciales de Alegra: GET /contacts?limit=1 con la Basic
 * Auth recibida por parámetro (no lee env ni provider: sirve para "probar
 * antes de guardar" desde la pantalla de credenciales).
 */
export async function testAlegraConnection(
  credentials: AlegraCredentials,
): Promise<ConnectionTestResult> {
  const auth = Buffer.from(
    `${credentials.email}:${credentials.apiToken}`,
  ).toString("base64");
  try {
    const response = await fetch(
      "https://api.alegra.com/api/v1/contacts?limit=1",
      {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      return { ok: false, message: describeStatus(response.status, "Alegra") };
    }
    return { ok: true, message: "Conexión con Alegra verificada" };
  } catch (error) {
    return { ok: false, message: describeNetworkError(error, "Alegra") };
  }
}
