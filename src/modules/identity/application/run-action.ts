import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/shared/actions/result";
import { DomainRuleError } from "@/shared/actions/errors";
import type {
  Action,
  Resource,
} from "@/modules/identity/domain/permissions";
import {
  PermissionError,
  requirePermission,
} from "@/modules/identity/application/require-permission";
import type { CurrentUser } from "@/modules/identity/domain/user";

/**
 * Runner genérico de server actions: aplica requirePermission(resource,
 * action) y convierte errores al contrato ActionResult (sin throws a la UI).
 */
export async function runAction<T>(
  resource: Resource,
  action: Action,
  fn: (user: CurrentUser) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const user = await requirePermission(resource, action);
    return actionOk(await fn(user));
  } catch (error) {
    if (error instanceof PermissionError || error instanceof DomainRuleError) {
      return actionError(error.message);
    }
    console.error(`[${resource} action]`, error);
    return actionError("Error inesperado, intenta de nuevo");
  }
}
