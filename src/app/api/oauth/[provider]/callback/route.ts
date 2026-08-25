import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import { verifyOAuthState } from "@/modules/settings/infrastructure/oauth-state";
import {
  exchangeCode,
  identify,
  isOAuthProvider,
} from "@/modules/settings/infrastructure/oauth-providers";
import { encryptPayload } from "@/modules/settings/infrastructure/credentials-crypto";
import { upsertCredentials } from "@/modules/settings/infrastructure/credentials-repository";
import {
  discoverAdAccounts,
  runManualSync,
} from "@/integrations/shared/manual-operations";

/** Callback OAuth: valida state, intercambia code→tokens, guarda
 * cifrado y dispara el descubrimiento inicial (sync) del proveedor. */
/** Origin canónico: en producción erp.govivo.ai vía NEXT_PUBLIC_APP_URL. */
const appOrigin = (request: NextRequest) =>
  process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const settingsUrl = (suffix: string) =>
    NextResponse.redirect(`${appOrigin(request)}/settings${suffix}`);

  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Proveedor no soportado" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings", "write")) {
    return settingsUrl("?oauth_error=forbidden");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || !verifyOAuthState(state, provider, user.id)) {
    return settingsUrl("?oauth_error=state");
  }

  try {
    const redirectUri = `${appOrigin(request)}/api/oauth/${provider}/callback`;
    // Intuit entrega el realmId (company id) como query param del callback.
    const realmId = request.nextUrl.searchParams.get("realmId");
    if (provider === "quickbooks" && !realmId) {
      return settingsUrl("?oauth_error=exchange");
    }
    const tokens = await exchangeCode(provider, code, redirectUri);
    const connectedAs = await identify(provider, tokens.accessToken);
    const payload = {
      ...tokens,
      ...(provider === "quickbooks" ? { realmId } : {}),
      meta: { ...tokens.meta, connectedAs, authMethod: "oauth" },
    };
    await upsertCredentials(provider, encryptPayload(payload), user.id);

    // Alta inmediata best-effort: meta_ads descubre las ad accounts con
    // la variante ligera (sin insights — el cron trae métricas después);
    // clickup corre su sync normal (liviano).
    if (provider === "meta_ads") {
      await discoverAdAccounts().catch(() => undefined);
    } else {
      await runManualSync(provider).catch(() => undefined);
    }

    return settingsUrl(`?connected=${provider}`);
  } catch (error) {
    // Solo message: nunca el objeto completo (podría anidar URLs/params).
    console.error(
      `[oauth callback ${provider}]`,
      error instanceof Error ? error.message : String(error),
    );
    return settingsUrl("?oauth_error=exchange");
  }
}
