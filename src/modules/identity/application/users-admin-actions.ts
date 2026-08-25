"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DomainRuleError } from "@/shared/actions/errors";
import {
  actionError,
  actionValidationError,
  type ActionResult,
} from "@/shared/actions/result";
import { ROLES } from "@/modules/identity/domain/permissions";
import type { CurrentUser } from "@/modules/identity/domain/user";
import { runAction } from "@/modules/identity/application/run-action";
import * as repo from "@/modules/identity/infrastructure/users-repository";

/** Vista de usuario para settings/users — mismo shape que CurrentUser. */
export type ManagedUser = CurrentUser;

function toManagedUser(row: repo.UserRow): ManagedUser {
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

/** Solo admin (settings es admin-only en la matriz RBAC). */
export async function listUsers(): Promise<ActionResult<ManagedUser[]>> {
  return runAction("settings", "read", async () => {
    const rows = await repo.listAllUsers();
    return rows.map(toManagedUser);
  });
}

const setRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(ROLES),
});

export async function setUserRole(
  input: unknown,
): Promise<ActionResult<ManagedUser>> {
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) return actionValidationError(parsed.error);
  const result = await runAction("settings", "write", async (admin) => {
    if (admin.id === parsed.data.userId && parsed.data.role !== "admin") {
      throw new DomainRuleError("No puedes quitarte tu propio rol de admin");
    }
    return repo.setUserRole(parsed.data.userId, parsed.data.role);
  });
  if (!result.ok) return result;
  if (!result.data) return actionError("Usuario no encontrado");
  revalidatePath("/settings");
  return { ok: true, data: toManagedUser(result.data) };
}

const setActiveSchema = z.object({
  userId: z.uuid(),
  isActive: z.boolean(),
});

export async function setUserActive(
  input: unknown,
): Promise<ActionResult<ManagedUser>> {
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return actionValidationError(parsed.error);
  const result = await runAction("settings", "write", async (admin) => {
    if (admin.id === parsed.data.userId && !parsed.data.isActive) {
      throw new DomainRuleError("No puedes desactivar tu propia cuenta");
    }
    return repo.setUserActive(parsed.data.userId, parsed.data.isActive);
  });
  if (!result.ok) return result;
  if (!result.data) return actionError("Usuario no encontrado");
  revalidatePath("/settings");
  return { ok: true, data: toManagedUser(result.data) };
}
