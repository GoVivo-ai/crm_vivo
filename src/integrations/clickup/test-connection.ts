import {
  describeNetworkError,
  describeStatus,
  TEST_TIMEOUT_MS,
  type ConnectionTestResult,
} from "@/integrations/shared/test-connection";

export interface ClickUpCredentials {
  token: string;
}

/**
 * Test barato del token de ClickUp: GET /user devuelve el usuario dueño
 * del token. Credenciales por parámetro (no lee env ni provider).
 */
export async function testClickUpConnection(
  credentials: ClickUpCredentials,
): Promise<ConnectionTestResult> {
  try {
    const response = await fetch("https://api.clickup.com/api/v2/user", {
      headers: {
        Authorization: credentials.token,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { ok: false, message: describeStatus(response.status, "ClickUp") };
    }
    const body = (await response.json()) as {
      user?: { username?: string };
    };
    const who = body.user?.username;
    return {
      ok: true,
      message: who
        ? `Conexión con ClickUp verificada (usuario: ${who})`
        : "Conexión con ClickUp verificada",
    };
  } catch (error) {
    return { ok: false, message: describeNetworkError(error, "ClickUp") };
  }
}
