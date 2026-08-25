import { cache } from "react";
import type {
  Integration,
  IntegrationPayloadMap,
} from "@/modules/settings/domain/types";
import { decryptPayload } from "@/modules/settings/infrastructure/credentials-crypto";
import { findCredentialsRow } from "@/modules/settings/infrastructure/credentials-repository";

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
        ? ({ token: env.CLICKUP_TOKEN } as IntegrationPayloadMap[I])
        : null;
  }
}

/**
 * CredentialsProvider: BD (cifrado AES-256-GCM) → payload tipado, con
 * fallback a env vars si no hay fila. Cacheado por request (React cache);
 * los crons leen de BD en cada corrida — rotación sin redeploy.
 * SOLO para uso server-side (adapters, crons, tests de conexión):
 * jamás pasar el resultado a la UI.
 */
export const getIntegrationCredentials = cache(
  async <I extends Integration>(
    integration: I,
  ): Promise<IntegrationPayloadMap[I] | null> => {
    const row = await findCredentialsRow(integration);
    if (!row) return envFallback(integration);
    return decryptPayload<IntegrationPayloadMap[I]>(row.payloadEncrypted);
  },
);
