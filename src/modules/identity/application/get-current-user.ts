import { auth } from "@clerk/nextjs/server";
import type { CurrentUser } from "@/modules/identity/domain/user";
import { findUserByClerkId } from "@/modules/identity/infrastructure/users-repository";
import { provisionCurrentClerkUser } from "@/modules/identity/application/provision-user";

/** Refresco de perfil (imageUrl/name/email) desde Clerk aunque la fila
 * exista: cubre cambios de foto cuando el webhook user.updated no llega
 * (dev) o se pierde. Throttle en memoria por instancia — como mucho una
 * llamada a la API de Clerk cada 15 min por usuario. */
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const lastProfileRefresh = new Map<string, number>();

function shouldRefreshProfile(clerkId: string): boolean {
  const last = lastProfileRefresh.get(clerkId) ?? 0;
  if (Date.now() - last < REFRESH_INTERVAL_MS) return false;
  lastProfileRefresh.set(clerkId, Date.now());
  return true;
}

/**
 * Usuario autenticado actual desde la tabla users (poblada por el webhook
 * de Clerk; con fallback de auto-aprovisionamiento si la fila no existe —
 * cubre desarrollo local y webhooks perdidos). Retorna null si no hay
 * sesión o el usuario está desactivado (pendiente de activación).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let row = await findUserByClerkId(clerkId);
  if (!row || shouldRefreshProfile(clerkId)) {
    // Crea la fila si falta (webhook perdido/dev) o re-upserta el perfil
    // — el upsert nunca toca role/isActive salvo INITIAL_ADMIN_EMAIL.
    row = (await provisionCurrentClerkUser()) ?? row;
  }
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    clerkId: row.clerkId,
    email: row.email,
    name: row.name,
    imageUrl: row.imageUrl,
    role: row.role,
    isActive: row.isActive,
  };
}
