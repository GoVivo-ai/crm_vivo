import type {
  Integration,
  IntegrationPayload,
} from "@/modules/settings/domain/types";

/**
 * CONTRATO backend↔Integraciones (creado por backend; lo implementa
 * Integraciones). Los actions de settings delegan aquí:
 * - testConnection: llamada barata a la API de cada integración con las
 *   credenciales dadas (Alegra GET /contacts?limit=1, Windsor connectors,
 *   ClickUp GET /user). No debe lanzar: siempre {ok, error}.
 * - runManualSync: el "Sincronizar ahora" de la UI; reutiliza la misma
 *   lógica de los crons.
 */
export type ConnectionTestResult = { ok: boolean; error: string | null };

export async function testConnection(
  integration: Integration,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: IntegrationPayload,
): Promise<ConnectionTestResult> {
  return {
    ok: false,
    error: `Test de conexión de ${integration} aún no implementado (Integraciones)`,
  };
}

export async function runManualSync(
  integration: Integration,
): Promise<{ ok: boolean; error: string | null }> {
  return {
    ok: false,
    error: `Sync manual de ${integration} aún no implementado (Integraciones)`,
  };
}
