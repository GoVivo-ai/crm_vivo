import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import { createOAuthState } from "@/modules/settings/infrastructure/oauth-state";
import {
  buildAuthorizeUrl,
  isOAuthProvider,
} from "@/modules/settings/infrastructure/oauth-providers";

/** Inicia el flujo OAuth (settings:write). Redirige al proveedor con
 * state anti-CSRF firmado. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Proveedor no soportado" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings", "write")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  try {
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const redirectUri = `${appOrigin}/api/oauth/${provider}/callback`;
    const state = createOAuthState(provider, user.id);
    return NextResponse.redirect(buildAuthorizeUrl(provider, redirectUri, state));
  } catch (error) {
    console.error(
      `[oauth start ${provider}]`,
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/settings?oauth_error=config`,
    );
  }
}
