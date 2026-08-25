import type { z } from "zod";
import {
  actionValidationError,
  type ActionResult,
} from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import type { CurrentUser } from "@/modules/identity/domain/user";

/**
 * Envuelve un server action del CRM: aplica requirePermission('crm', ...)
 * y convierte cualquier error al contrato ActionResult (sin throws a la UI).
 */
export function runCrmAction<T>(
  action: "read" | "write",
  fn: (user: CurrentUser) => Promise<T>,
): Promise<ActionResult<T>> {
  return runAction("crm", action, fn);
}

/** Valida input con zod y retorna ActionResult de error si falla. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, result: actionValidationError(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
