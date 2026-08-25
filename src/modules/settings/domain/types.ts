export type Integration = "quickbooks" | "meta_ads" | "clickup";



/** Tokens OAuth cifrados en BD. expiresAt ISO; meta guarda datos no
 * sensibles del flujo (connectedAs, ids). */
export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  meta?: Record<string, unknown>;
};

export type MetaAdsCredentials = OAuthTokens & { businessId?: string };
export type ClickupCredentials = OAuthTokens;
/** realmId (company id de Intuit) llega en el callback; sin él no se
 * puede llamar la API. Vive SOLO en el payload cifrado. */
export type QuickbooksCredentials = OAuthTokens & { realmId: string };

export type IntegrationPayloadMap = {
  quickbooks: QuickbooksCredentials;
  meta_ads: MetaAdsCredentials;
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
  /** Cómo se conectó: OAuth (botón Conectar) o manual (solo Alegra). */
  authMethod: "oauth" | "manual" | null;
  /** Identidad no sensible del flujo OAuth ("Conectado como X"). */
  connectedAs: string | null;
  /** Vencimiento del token OAuth (ISO) si aplica. */
  tokenExpiresAt: string | null;
  /** true si el token OAuth ya venció: la card muestra "Reconectar". */
  reconnectRequired: boolean;
  configuredAt: Date | null;
  lastTest: { ok: boolean; testedAt: Date; error: string | null } | null;
  /** Última corrida de sync_runs de la fuente correspondiente. */
  lastSync: {
    status: "running" | "success" | "error";
    finishedAt: Date | null;
  } | null;
};
