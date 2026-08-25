"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import {
  listAccountsWithMrr,
  type AccountOptionWithMrr,
} from "@/modules/clients/infrastructure/clients-summary-repository";

/** Opciones de cuenta para el formulario de facturas (finance:read),
 * con MRR activo por moneda para el "contexto vivo" del cliente
 * seleccionado. */
export async function listAccountOptionsForInvoicing(): Promise<
  ActionResult<AccountOptionWithMrr[]>
> {
  return runAction("finance", "read", () => listAccountsWithMrr());
}
