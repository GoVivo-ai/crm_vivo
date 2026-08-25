"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<string, string> = {
  quickbooks: "QuickBooks",
  meta_ads: "Meta Ads",
  clickup: "ClickUp",
};

const ERROR_MESSAGES: Record<string, string> = {
  config:
    "Falta configuración del servidor para esta conexión — avisa a tu admin.",
  forbidden: "No tienes permiso para conectar integraciones.",
  state: "La sesión de conexión expiró. Intenta de nuevo.",
  exchange: "El proveedor rechazó la conexión. Intenta de nuevo.",
};

/**
 * Lee el retorno del callback OAuth (?connected= / ?oauth_error=), muestra
 * el toast y limpia la URL para que no se repita al refrescar.
 */
export function OAuthCallbackToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const connected = params.get("connected");
  const error = params.get("oauth_error");

  useEffect(() => {
    if (!connected && !error) return;
    if (connected) {
      toast.success(
        `${PROVIDER_LABELS[connected] ?? connected} conectado. Sincronizando…`,
      );
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] ?? "No se pudo completar la conexión.");
    }
    router.replace(pathname, { scroll: false });
  }, [connected, error, router, pathname]);

  return null;
}
