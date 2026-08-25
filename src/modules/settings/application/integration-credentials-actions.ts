"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  Integration,
  IntegrationPayload,
} from "@/modules/settings/domain/types";
import {
  clearCredentialsSchema,
  credentialsInputSchema,
  testConnectionSchema,
} from "@/modules/settings/domain/validation";
import { encryptPayload } from "@/modules/settings/infrastructure/credentials-crypto";
import * as repo from "@/modules/settings/infrastructure/credentials-repository";
import { getIntegrationCredentials } from "@/modules/settings/application/get-integration-credentials";
import {
  testConnection,
  type ConnectionTestResult,
} from "@/integrations/shared/manual-operations";

/** Guarda credenciales: valida, cifra (AES-256-GCM) y upsertea. */
export async function setIntegrationCredentials(
  input: unknown,
): Promise<ActionResult<{ integration: Integration }>> {
  const parsed = parseInput(credentialsInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const { integration, credentials } = parsed.data;
  return runAction("settings", "write", async (admin) => {
    await repo.upsertCredentials(
      integration,
      encryptPayload(credentials),
      admin.id,
    );
    revalidatePath("/settings");
    return { integration };
  });
}

/**
 * Prueba la conexión. Con credentials en el input prueba ESAS sin
 * guardar (y sin persistir last_test); sin credentials prueba las
 * guardadas/fallback y persiste last_test_* si hay fila en BD.
 */
export async function testIntegrationConnection(
  input: unknown,
): Promise<ActionResult<ConnectionTestResult>> {
  const parsed = parseInput(testConnectionSchema, input);
  if (!parsed.ok) return parsed.result;
  const { integration, credentials } = parsed.data;
  return runAction("settings", "write", async () => {
    let payload: IntegrationPayload | null;
    if (credentials) {
      const validated = credentialsInputSchema.safeParse({
        integration,
        credentials,
      });
      if (!validated.success) {
        return { ok: false, error: "Credenciales con formato inválido" };
      }
      payload = validated.data.credentials;
    } else {
      payload = await getIntegrationCredentials(integration);
    }
    if (!payload) {
      return { ok: false, error: "No hay credenciales configuradas" };
    }
    const result = await testConnection(integration, payload);
    if (!credentials) {
      const row = await repo.findCredentialsRow(integration);
      if (row) await repo.recordTestResult(integration, result.ok, result.error);
      revalidatePath("/settings");
    }
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
