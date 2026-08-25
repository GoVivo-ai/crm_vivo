import { auth } from "@clerk/nextjs/server";
import type { CurrentUser } from "@/modules/identity/domain/user";
import { findUserByClerkId } from "@/modules/identity/infrastructure/users-repository";
import { provisionCurrentClerkUser } from "@/modules/identity/application/provision-user";

/**
 * Usuario autenticado actual desde la tabla users (poblada por el webhook
 * de Clerk; con fallback de auto-aprovisionamiento si la fila no existe —
 * cubre desarrollo local y webhooks perdidos). Retorna null si no hay
 * sesión o el usuario está desactivado (pendiente de activación).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const row =
    (await findUserByClerkId(clerkId)) ?? (await provisionCurrentClerkUser());
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
