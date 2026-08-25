import type {
  ClickupCredentials,
  Integration,
  IntegrationPayload,
  MetaAdsCredentials,
  QuickbooksCredentials,
} from "@/modules/settings/domain/types";
import { testClickUpConnection } from "@/integrations/clickup/test-connection";
import { testMetaConnection } from "@/integrations/meta/test-connection";
import { testQuickbooksConnection } from "@/integrations/quickbooks/test-connection";
import { syncClickUp } from "@/integrations/clickup/sync-clickup";
import { syncQuickbooks } from "@/integrations/quickbooks/sync-quickbooks";
import {
  discoverMetaAdAccounts,
  syncMeta,
} from "@/integrations/meta/sync-meta";
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
      integration === "quickbooks"
        ? await testQuickbooksConnection(payload as QuickbooksCredentials)
        : integration === "meta_ads"
          ? await testMetaConnection(payload as MetaAdsCredentials)
          : await testClickUpConnection(payload as ClickupCredentials);
    return { ok: result.ok, error: result.ok ? null : result.message };
  } catch (error) {
    // Los tests no deberían lanzar; red de seguridad por contrato.
    return { ok: false, error: toReadableSyncError(error) };
  }
}

/**
 * Alta inmediata de ad accounts tras el callback OAuth de meta_ads —
 * más ligera que un sync completo (sin insights). Nunca lanza.
 */
export async function discoverAdAccounts(): Promise<{
  ok: boolean;
  accounts: number;
  error: string | null;
}> {
  try {
    const accounts = await discoverMetaAdAccounts();
    return { ok: true, accounts, error: null };
  } catch (error) {
    return { ok: false, accounts: 0, error: toReadableSyncError(error) };
  }
}

export async function runManualSync(
  integration: Integration,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    if (integration === "quickbooks") await syncQuickbooks();
    else if (integration === "meta_ads") await syncMeta();
    else await syncClickUp();
    return { ok: true, error: null };
  } catch (error) {
    // runSync ya dejó el detalle en sync_runs; aquí va el mensaje a la UI.
    return { ok: false, error: toReadableSyncError(error) };
  }
}
