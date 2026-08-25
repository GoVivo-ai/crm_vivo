import {
  describeNetworkError,
  describeStatus,
  TEST_TIMEOUT_MS,
  type ConnectionTestResult,
} from "@/integrations/shared/test-connection";
import type { QuickbooksCredentials } from "@/modules/settings/domain/types";

/**
 * Test barato de la conexión QBO: GET companyinfo/{realmId} (read-only).
 * Credenciales por parámetro; token en header Bearer, jamás serializado.
 */
export async function testQuickbooksConnection(
  credentials: QuickbooksCredentials,
): Promise<ConnectionTestResult> {
  const base =
    process.env.QBO_USE_SANDBOX === "true"
      ? "https://sandbox-quickbooks.api.intuit.com"
      : "https://quickbooks.api.intuit.com";
  const url = `${base}/v3/company/${credentials.realmId}/companyinfo/${credentials.realmId}?minorversion=75`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
    });
    if (response.status === 401) {
      return {
        ok: false,
        message:
          "Token de QuickBooks inválido o vencido; reconecta la cuenta",
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        message: describeStatus(response.status, "QuickBooks"),
      };
    }
    const body = (await response.json()) as {
      CompanyInfo?: { CompanyName?: string };
    };
    const company = body.CompanyInfo?.CompanyName;
    return {
      ok: true,
      message: company
        ? `Conexión con QuickBooks verificada (${company})`
        : "Conexión con QuickBooks verificada",
    };
  } catch (error) {
    return { ok: false, message: describeNetworkError(error, "QuickBooks") };
  }
}
