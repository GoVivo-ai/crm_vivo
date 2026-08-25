import { auth } from "@clerk/nextjs/server";
import type { CurrentUser } from "@/modules/identity/domain/user";
import { findUserByClerkId } from "@/modules/identity/infrastructure/users-repository";

/**
 * Usuario autenticado actual desde la tabla users (poblada por el webhook
 * de Clerk). Retorna null si no hay sesión, el usuario aún no existe en
 * la BD o está desactivado.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const row = await findUserByClerkId(clerkId);
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
