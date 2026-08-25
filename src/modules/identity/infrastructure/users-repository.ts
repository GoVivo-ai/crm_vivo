import { eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { users } from "@/modules/identity/schema";

export type UserRow = typeof users.$inferSelect;

export async function findUserByClerkId(
  clerkId: string,
): Promise<UserRow | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return rows[0];
}

export async function upsertUserFromClerk(input: {
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}): Promise<void> {
  // Deny-by-default: todo usuario nuevo entra inactivo hasta que un admin
  // lo active, salvo el admin inicial declarado en INITIAL_ADMIN_EMAIL.
  const initialAdmin = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const isInitialAdmin =
    !!initialAdmin && input.email.toLowerCase() === initialAdmin;
  await db
    .insert(users)
    .values(
      isInitialAdmin
        ? { ...input, role: "admin", isActive: true }
        : input,
    )
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        name: input.name,
        imageUrl: input.imageUrl,
        // Promueve también si la env var se configuró tras el primer login.
        ...(isInitialAdmin ? { role: "admin" as const, isActive: true } : {}),
        updatedAt: new Date(),
      },
    });
}

export async function deactivateUserByClerkId(clerkId: string): Promise<void> {
  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId));
}
