"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { Integration } from "@/modules/settings/domain/types";
import {
  clearCredentialsSchema,
  testConnectionSchema,
} from "@/modules/settings/domain/validation";
import * as repo from "@/modules/settings/infrastructure/credentials-repository";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";
import {
  testConnection,
  type ConnectionTestResult,
} from "@/integrations/shared/manual-operations";

/** Prueba la conexión con las credenciales guardadas (OAuth) o del
 * fallback env; persiste last_test_* cuando hay fila en BD. */
export async function testIntegrationConnection(
  input: unknown,
): Promise<ActionResult<ConnectionTestResult>> {
  const parsed = parseInput(testConnectionSchema, input);
  if (!parsed.ok) return parsed.result;
  const { integration } = parsed.data;
  return runAction("settings", "write", async () => {
    const payload = await getIntegrationCredentials(integration);
    if (!payload) {
      return { ok: false, error: "La integración no está conectada" };
    }
    const result = await testConnection(integration, payload);
    const row = await repo.findCredentialsRow(integration);
    if (row) await repo.recordTestResult(integration, result.ok, result.error);
    revalidatePath("/settings");
    return result;
  });
}

/** Borra las credenciales de BD (vuelve al fallback env si existe). */
export async function clearIntegrationCredentials(
  input: unknown,
): Promise<ActionResult<{ integration: Integration }>> {
  const parsed = parseInput(clearCredentialsSchema, input);
  if (!parsed.ok) return parsed.result;
  const { integration } = parsed.data;
  const result = await runAction("settings", "write", () =>
    repo.deleteCredentials(integration),
  );
  if (!result.ok) return result;
  if (!result.data) return actionError("No había credenciales guardadas");
  revalidatePath("/settings");
  return { ok: true, data: { integration } };
}
