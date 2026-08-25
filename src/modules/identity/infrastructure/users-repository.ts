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
  await db
    .insert(users)
    .values(input)
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        name: input.name,
        imageUrl: input.imageUrl,
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
