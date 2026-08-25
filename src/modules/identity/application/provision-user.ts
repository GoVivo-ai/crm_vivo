import { currentUser } from "@clerk/nextjs/server";
import {
  findUserByClerkId,
  upsertUserFromClerk,
  type UserRow,
} from "@/modules/identity/infrastructure/users-repository";

/**
 * Aprovisiona en la tabla users al usuario Clerk de la sesión actual.
 * Camino principal en producción: el webhook de Clerk. Este fallback cubre
 * desarrollo local (el webhook no llega) y webhooks perdidos. Reutiliza el
 * MISMO upsert del webhook (idempotente por clerk_id, con promoción por
 * INITIAL_ADMIN_EMAIL), así que ambas rutas son consistentes ante carrera.
 */
export async function provisionCurrentClerkUser(): Promise<UserRow | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;

  await upsertUserFromClerk({
    clerkId: clerkUser.id,
    email,
    name,
    imageUrl: clerkUser.imageUrl ?? null,
  });

  return (await findUserByClerkId(clerkUser.id)) ?? null;
}
