export type Integration = "alegra" | "windsor" | "clickup";

export type AlegraCredentials = { email: string; token: string };
export type WindsorCredentials = { apiKey: string };
export type ClickupCredentials = { token: string };

export type IntegrationPayloadMap = {
  alegra: AlegraCredentials;
  windsor: WindsorCredentials;
  clickup: ClickupCredentials;
};

export type IntegrationPayload = IntegrationPayloadMap[Integration];

/** Estado por integración para la UI — NUNCA contiene secretos. */
export type IntegrationStatus = {
  integration: Integration;
  /** true si hay credenciales guardadas en BD (no cuenta el fallback env). */
  configured: boolean;
  /** true si sin fila en BD existen las env vars de fallback. */
  envFallbackAvailable: boolean;
  /** Pista no sensible, ej. "****1234" (email de Alegra / cola del token). */
  hint: string | null;
  configuredAt: Date | null;
  lastTest: { ok: boolean; testedAt: Date; error: string | null } | null;
  /** Última corrida de sync_runs de la fuente correspondiente. */
  lastSync: {
    status: "running" | "success" | "error";
    finishedAt: Date | null;
  } | null;
};
