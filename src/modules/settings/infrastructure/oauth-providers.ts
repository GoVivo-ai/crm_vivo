import { resilientFetch } from "@/shared/http/resilient-fetch";
import type { OAuthTokens } from "@/modules/settings/domain/types";

export type OAuthProvider = "quickbooks" | "meta_ads" | "clickup";

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  "quickbooks",
  "meta_ads",
  "clickup",
];

export const isOAuthProvider = (v: string): v is OAuthProvider =>
  (OAUTH_PROVIDERS as string[]).includes(v);

type ProviderConfig = {
  authUrl: string;
  scopes: string | null;
  clientIdEnv: string;
  clientSecretEnv: string;
};

const CONFIG: Record<OAuthProvider, ProviderConfig> = {
  quickbooks: {
    authUrl: "https://appcenter.intuit.com/connect/oauth2",
    scopes: "com.intuit.quickbooks.accounting",
    clientIdEnv: "QBO_CLIENT_ID",
    clientSecretEnv: "QBO_CLIENT_SECRET",
  },
  meta_ads: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    scopes: "ads_read,business_management",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
  },
  clickup: {
    authUrl: "https://app.clickup.com/api",
    scopes: null, // ClickUp no usa parámetro scope
    clientIdEnv: "CLICKUP_CLIENT_ID",
    clientSecretEnv: "CLICKUP_CLIENT_SECRET",
  },
};

function appCredentials(provider: OAuthProvider) {
  const cfg = CONFIG[provider];
  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) {
    throw new Error(
      `Faltan ${cfg.clientIdEnv}/${cfg.clientSecretEnv} en el entorno`,
    );
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
): string {
  const cfg = CONFIG[provider];
  const { clientId } = appCredentials(provider);
  const url = new URL(cfg.authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  if (cfg.scopes) url.searchParams.set("scope", cfg.scopes);
  if (provider !== "clickup") url.searchParams.set("response_type", "code");
  return url.toString();
}

const asJson = async (res: Response) => (await res.json()) as Record<string, unknown>;

const INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

/** POST al token endpoint de Intuit con Basic auth. */
async function intuitTokenRequest(
  provider: OAuthProvider,
  body: URLSearchParams,
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = appCredentials(provider);
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await resilientFetch(INTUIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  return {
    accessToken: String(data.access_token),
    // Intuit ROTA el refresh_token en cada refresh: persistir SIEMPRE el
    // último o la conexión muere en silencio.
    refreshToken: String(data.refresh_token),
    expiresAt: new Date(
      Date.now() + Number(data.expires_in ?? 3600) * 1000,
    ).toISOString(),
    meta: {
      refreshExpiresAt: new Date(
        Date.now() + Number(data.x_refresh_token_expires_in ?? 100 * 86400) * 1000,
      ).toISOString(),
    },
  };
}

/** code → tokens. Meta: exchange adicional a long-lived (~60 días). */
export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = appCredentials(provider);

  if (provider === "quickbooks") {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
    return intuitTokenRequest(provider, body);
  }

  if (provider === "meta_ads") {
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const short = await asJson(await resilientFetch(tokenUrl.toString()));

    const longUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", clientId);
    longUrl.searchParams.set("client_secret", clientSecret);
    longUrl.searchParams.set("fb_exchange_token", String(short.access_token));
    const long = await asJson(await resilientFetch(longUrl.toString()));
    const expiresIn = Number(long.expires_in ?? 60 * 24 * 3600);
    return {
      accessToken: String(long.access_token),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  const res = await resilientFetch(
    "https://api.clickup.com/api/v2/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    },
  );
  const data = await asJson(res);
  // Los tokens de ClickUp no expiran.
  return { accessToken: String(data.access_token) };
}

/** Identidad no sensible para "Conectado como X". Nunca lanza. */
export async function identify(
  provider: OAuthProvider,
  accessToken: string,
): Promise<string | null> {
  try {
    if (provider === "meta_ads") {
      const url = new URL("https://graph.facebook.com/v21.0/me");
      url.searchParams.set("fields", "name");
      url.searchParams.set("access_token", accessToken);
      const data = await asJson(await resilientFetch(url.toString()));
      return data.name ? String(data.name) : null;
    }
    if (provider === "clickup") {
      const res = await resilientFetch("https://api.clickup.com/api/v2/user", {
        headers: { Authorization: accessToken },
      });
      const data = (await res.json()) as { user?: { username?: string } };
      return data.user?.username ?? null;
    }
    return null; // quickbooks: connectedAs lo resuelve el callback con realmId
  } catch {
    return null;
  }
}

/** Meta: re-exchange del token vigente. QuickBooks: refresh_token grant
 * (Intuit rota el refresh token — se persiste el nuevo; refresh expira a
 * ~100 días de inactividad → reconnectRequired). ClickUp no expira. */
export async function refreshTokens(
  provider: OAuthProvider,
  current: OAuthTokens,
): Promise<OAuthTokens | null> {
  if (provider === "quickbooks") {
    if (!current.refreshToken) return null;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    });
    const fresh = await intuitTokenRequest(provider, body);
    // Conserva realmId/connectedAs y demás campos del payload actual.
    return { ...current, ...fresh, meta: { ...current.meta, ...fresh.meta } };
  }
  if (provider !== "meta_ads") return null;
  const { clientId, clientSecret } = appCredentials(provider);
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", current.accessToken);
  const data = await asJson(await resilientFetch(url.toString()));
  const expiresIn = Number(data.expires_in ?? 60 * 24 * 3600);
  return {
    ...current,
    accessToken: String(data.access_token),
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}
