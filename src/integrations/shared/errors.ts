import { HttpError } from "@/shared/http/resilient-fetch";
import { describeStatus } from "@/integrations/shared/test-connection";

function serviceFromUrl(url: string): string {
  if (url.includes("alegra.com")) return "Alegra";
  if (url.includes("clickup.com")) return "ClickUp";
  if (url.includes("facebook.com")) return "Meta Ads";
  return "el servicio externo";
}

/**
 * Convierte cualquier fallo de sync en un mensaje legible para
 * sync_runs.error (nunca un stacktrace). Un 401/403 de un adapter se lee
 * como "Credenciales de X inválidas...", igual que en los tests de conexión.
 */
export function toReadableSyncError(error: unknown): string {
  if (error instanceof HttpError) {
    return describeStatus(error.status, serviceFromUrl(error.url));
  }
  if (error instanceof Error) {
    // Primera línea del mensaje, sin stack.
    return error.message.split("\n")[0];
  }
  return String(error);
}
