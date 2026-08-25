import { cache } from "react";
import type {
  Integration,
  IntegrationPayloadMap,
  OAuthTokens,
} from "@/modules/settings/domain/types";
import {
  decryptPayload,
  encryptPayload,
} from "@/modules/settings/infrastructure/credentials-crypto";
import { findCredentialsRow } from "@/modules/settings/infrastructure/credentials-repository";
import {
  isOAuthProvider,
  refreshTokens,
} from "@/modules/settings/infrastructure/oauth-providers";
import { db } from "@/shared/database/db";
import { integrationCredentials } from "@/modules/settings/schema";
import { eq } from "drizzle-orm";

/** Fallback a las env vars clásicas cuando no hay fila en BD. */
export function envFallback<I extends Integration>(
  integration: I,
): IntegrationPayloadMap[I] | null {
  const env = process.env;
  switch (integration) {
    case "quickbooks":
      return env.QBO_ACCESS_TOKEN && env.QBO_REALM_ID
        ? ({
            accessToken: env.QBO_ACCESS_TOKEN,
            refreshToken: env.QBO_REFRESH_TOKEN || undefined,
            realmId: env.QBO_REALM_ID,
          } as IntegrationPayloadMap[I])
        : null;
    case "meta_ads":
      return env.META_ADS_ACCESS_TOKEN
        ? ({
            accessToken: env.META_ADS_ACCESS_TOKEN,
            businessId: env.META_ADS_BUSINESS_ID || undefined,
          } as IntegrationPayloadMap[I])
        : null;
    default:
      return env.CLICKUP_TOKEN
        ? ({ accessToken: env.CLICKUP_TOKEN } as IntegrationPayloadMap[I])
        : null;
  }
}

/** Ventana de renovación por proveedor: Meta re-exchange con 15 días de
 * margen (no hay refresh_token); QuickBooks access de 1h → refresh con
 * 10 min de margen (refresh_token rotativo). */
const REFRESH_WINDOW_MS: Record<string, number> = {
  meta_ads: 15 * 24 * 3600 * 1000,
  quickbooks: 10 * 60 * 1000,
};

/** Lock simple anti-carrera por integración (por instancia). */
const refreshLocks = new Map<string, Promise<OAuthTokens | null>>();

async function refreshIfNeeded(
  integration: Integration,
  payload: OAuthTokens,
): Promise<OAuthTokens> {
  if (!isOAuthProvider(integration) || !payload.expiresAt) return payload;
  const remaining = Date.parse(payload.expiresAt) - Date.now();
  if (remaining > (REFRESH_WINDOW_MS[integration] ?? 0)) return payload;

  let pending = refreshLocks.get(integration);
  if (!pending) {
    pending = refreshTokens(integration, payload)
      .then(async (refreshed) => {
        if (refreshed) {
          await db
            .update(integrationCredentials)
            .set({ payloadEncrypted: encryptPayload(refreshed) })
            .where(eq(integrationCredentials.integration, integration));
        }
        return refreshed;
      })
      .catch((error) => {
        console.error(
          `[oauth refresh ${integration}]`,
          error instanceof Error ? error.message : String(error),
        );
        return null;
      })
      .finally(() => refreshLocks.delete(integration));
    refreshLocks.set(integration, pending);
  }
  return (await pending) ?? payload; // token viejo puede seguir sirviendo
}

/**
 * CredentialsProvider: BD (cifrado AES-256-GCM) → payload tipado, con
 * fallback a env vars si no hay fila y refresh automático de tokens
 * OAuth por vencer. Cacheado por request (React cache); los crons leen
 * de BD en cada corrida — rotación sin redeploy. SOLO uso server-side:
 * jamás pasar el resultado a la UI.
 */
export const getIntegrationCredentials = cache(
  async <I extends Integration>(
    integration: I,
  ): Promise<IntegrationPayloadMap[I] | null> => {
    const row = await findCredentialsRow(integration);
    if (!row) return envFallback(integration);
    const payload = decryptPayload<IntegrationPayloadMap[I]>(
      row.payloadEncrypted,
    );
    if (isOAuthProvider(integration)) {
      return (await refreshIfNeeded(
        integration,
        payload as OAuthTokens,
      )) as IntegrationPayloadMap[I];
    }
    return payload;
  },
);
