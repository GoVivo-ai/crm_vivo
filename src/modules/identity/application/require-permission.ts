import {
  can,
  type Action,
  type Resource,
} from "@/modules/identity/domain/permissions";
import type { CurrentUser } from "@/modules/identity/domain/user";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";

export class PermissionError extends Error {
  constructor(resource: Resource, action: Action) {
    super(`Sin permiso para ${action} en ${resource}`);
    this.name = "PermissionError";
  }
}

/**
 * Guard obligatorio al inicio de cada Server Action. Lanza PermissionError
 * si no hay sesión o el rol no tiene el permiso; el action lo captura y
 * retorna ActionResult { ok: false }.
 */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, resource, action)) {
    throw new PermissionError(resource, action);
  }
  return user;
}
