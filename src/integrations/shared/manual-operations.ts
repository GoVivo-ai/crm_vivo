import type {
  AlegraCredentials,
  ClickupCredentials,
  Integration,
  IntegrationPayload,
  WindsorCredentials,
} from "@/modules/settings/domain/types";
import { testAlegraConnection } from "@/integrations/alegra/test-connection";
import { testClickUpConnection } from "@/integrations/clickup/test-connection";
import { testWindsorConnection } from "@/integrations/windsor/test-connection";
import { syncAlegra } from "@/integrations/alegra/sync-alegra";
import { syncClickUp } from "@/integrations/clickup/sync-clickup";
import { syncWindsor } from "@/integrations/windsor/sync-windsor";
import { toReadableSyncError } from "@/integrations/shared/errors";

/**
 * CONTRATO backend↔Integraciones: los actions de settings delegan aquí.
 * - testConnection: llamada barata por integración con las credenciales
 *   recibidas (sirve para "probar antes de guardar"). Nunca lanza.
 * - runManualSync: el "Sincronizar ahora" de la UI; reutiliza la lógica de
 *   los crons, así queda registrado en sync_runs como cualquier corrida.
 * Los mensajes de error son legibles y sin secretos (sanitizados aguas
 * arriba por test-connection/toReadableSyncError).
 */
export type ConnectionTestResult = { ok: boolean; error: string | null };

export async function testConnection(
  integration: Integration,
  payload: IntegrationPayload,
): Promise<ConnectionTestResult> {
  try {
    const result =
      integration === "alegra"
        ? await testAlegraConnection(payload as AlegraCredentials)
        : integration === "windsor"
          ? await testWindsorConnection(payload as WindsorCredentials)
          : await testClickUpConnection(payload as ClickupCredentials);
    return { ok: result.ok, error: result.ok ? null : result.message };
  } catch (error) {
    // Los tests no deberían lanzar; red de seguridad por contrato.
    return { ok: false, error: toReadableSyncError(error) };
  }
}

export async function runManualSync(
  integration: Integration,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    if (integration === "alegra") await syncAlegra();
    else if (integration === "windsor") await syncWindsor();
    else await syncClickUp();
    return { ok: true, error: null };
  } catch (error) {
    // runSync ya dejó el detalle en sync_runs; aquí va el mensaje a la UI.
    return { ok: false, error: toReadableSyncError(error) };
  }
}
