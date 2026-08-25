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
import { runManualSync } from "@/integrations/shared/manual-operations";

/** Callback OAuth: valida state, intercambia code→tokens, guarda
 * cifrado y dispara el descubrimiento inicial (sync) del proveedor. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const settingsUrl = (suffix: string) =>
    NextResponse.redirect(`${request.nextUrl.origin}/settings${suffix}`);

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
    const redirectUri = `${request.nextUrl.origin}/api/oauth/${provider}/callback`;
    const tokens = await exchangeCode(provider, code, redirectUri);
    const connectedAs = await identify(provider, tokens.accessToken);
    const payload = {
      ...tokens,
      meta: { ...tokens.meta, connectedAs, authMethod: "oauth" },
    };
    await upsertCredentials(provider, encryptPayload(payload), user.id);

    // Alta inmediata de datos (para meta_ads descubre las ad accounts).
    // Best-effort: si falla, queda registrado en sync_runs.
    await runManualSync(provider, "core").catch(() => undefined);

    return settingsUrl(`?connected=${provider}`);
  } catch (error) {
    console.error(`[oauth callback ${provider}]`, error);
    return settingsUrl("?oauth_error=exchange");
  }
}
