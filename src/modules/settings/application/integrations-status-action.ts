"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import type {
  Integration,
  IntegrationStatus,
} from "@/modules/settings/domain/types";
import { decryptPayload } from "@/modules/settings/infrastructure/credentials-crypto";
import { listCredentialsRows } from "@/modules/settings/infrastructure/credentials-repository";
import { envFallback } from "@/modules/settings/application/get-integration-credentials";
import { getLastRunPerSource } from "@/modules/finance/infrastructure/sync-status-repository";

const INTEGRATIONS: Integration[] = ["alegra", "meta_ads", "clickup"];

const mask = (value: string) => `****${value.slice(-4)}`;

/** Pista NO sensible por integración: email de Alegra enmascarado; para
 * tokens, solo los últimos 4 caracteres. */
function hintFor(integration: Integration, payload: unknown): string | null {
  const p = payload as Record<string, string>;
  if (integration === "alegra" && p.email) return p.email;
  const secret = p.accessToken ?? p.token;
  return secret ? mask(secret) : null;
}

/** Estado para la UI de settings/integrations. NUNCA devuelve secretos:
 * el payload se descifra solo para derivar el hint. */
export async function getIntegrationsStatus(): Promise<
  ActionResult<Record<Integration, IntegrationStatus>>
> {
  return runAction("settings", "read", async () => {
    const [rows, lastRuns] = await Promise.all([
      listCredentialsRows(),
      getLastRunPerSource(),
    ]);

    const result = {} as Record<Integration, IntegrationStatus>;
    const payloadMeta = new Map<Integration, Record<string, unknown>>();
    for (const integration of INTEGRATIONS) {
      const row = rows.find((r) => r.integration === integration);
      let hint: string | null = null;
      if (row) {
        try {
          const payload = decryptPayload<Record<string, unknown>>(
            row.payloadEncrypted,
          );
          hint = hintFor(integration, payload);
          payloadMeta.set(integration, {
            ...(payload.meta as Record<string, unknown> | undefined),
            expiresAt: payload.expiresAt,
          });
        } catch {
          hint = null; // key rotada o dato corrupto: configurada, sin pista
        }
      }
      const lastRun = lastRuns[integration];
      const meta = (payloadMeta.get(integration) ?? {}) as {
        connectedAs?: string;
        authMethod?: string;
        expiresAt?: string;
      };
      const tokenExpiresAt = meta.expiresAt ?? null;
      result[integration] = {
        integration,
        configured: !!row,
        envFallbackAvailable: !row && envFallback(integration) !== null,
        hint,
        authMethod: row
          ? meta.authMethod === "oauth"
            ? "oauth"
            : "manual"
          : null,
        connectedAs: meta.connectedAs ?? null,
        tokenExpiresAt,
        reconnectRequired:
          !!tokenExpiresAt && Date.parse(tokenExpiresAt) < Date.now(),
        configuredAt: row?.configuredAt ?? null,
        lastTest:
          row?.lastTestStatus && row.lastTestAt
            ? {
                ok: row.lastTestStatus === "ok",
                testedAt: row.lastTestAt,
                error: row.lastTestError,
              }
            : null,
        lastSync: lastRun
          ? { status: lastRun.status, finishedAt: lastRun.finishedAt }
          : null,
      };
    }
    return result;
  });
}
