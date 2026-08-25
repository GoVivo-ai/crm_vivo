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
    case "alegra":
      return env.ALEGRA_EMAIL && env.ALEGRA_API_TOKEN
        ? ({
            email: env.ALEGRA_EMAIL,
            token: env.ALEGRA_API_TOKEN,
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

/** Re-exchange cuando faltan < 15 días (Meta no da refresh_token: se
 * renueva con fb_exchange_token mientras el token siga vigente). */
const REFRESH_WINDOW_MS = 15 * 24 * 3600 * 1000;

/** Lock simple anti-carrera por integración (por instancia). */
const refreshLocks = new Map<string, Promise<OAuthTokens | null>>();

async function refreshIfNeeded(
  integration: Integration,
  payload: OAuthTokens,
): Promise<OAuthTokens> {
  if (!isOAuthProvider(integration) || !payload.expiresAt) return payload;
  const remaining = Date.parse(payload.expiresAt) - Date.now();
  if (remaining > REFRESH_WINDOW_MS) return payload;

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
        console.error(`[oauth refresh ${integration}]`, error);
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
