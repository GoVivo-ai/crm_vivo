"use server";

import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { Invoice } from "@/modules/finance/domain/types";
import {
  invoiceInputSchema,
  invoiceListFilterSchema,
  type InvoiceListFilter,
} from "@/modules/finance/domain/validation";
import * as repo from "@/modules/finance/infrastructure/invoices-repository";

/** Listado de facturas (finance:read); filtros opcionales. */
export async function listInvoices(
  filter: InvoiceListFilter = {},
): Promise<ActionResult<Invoice[]>> {
  const parsed = parseInput(invoiceListFilterSchema, filter);
  if (!parsed.ok) return parsed.result;
  return runAction("finance", "read", () => repo.listInvoices(parsed.data));
}

/** Registro manual de factura de ingreso (finance:write). */
export async function createInvoice(
  input: unknown,
): Promise<ActionResult<Invoice>> {
  const parsed = parseInput(invoiceInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("finance", "write", async (user) => {
    const invoice = await repo.insertInvoice(parsed.data, user.id);
    revalidatePath("/finance");
    return invoice;
  });
}

/** Edición — SOLO facturas manuales (las de QuickBooks son de solo
 * lectura; se actualizan por sync). */
export async function updateInvoice(
  id: string,
  input: unknown,
): Promise<ActionResult<Invoice>> {
  const parsed = parseInput(invoiceInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("finance", "write", async (user) => {
    const existing = await repo.findInvoiceRow(id);
    if (!existing) throw new DomainRuleError("Factura no encontrada");
    if (existing.source !== "manual") {
      throw new DomainRuleError(
        "Las facturas sincronizadas de QuickBooks son de solo lectura",
      );
    }
    const invoice = await repo.updateInvoiceById(id, parsed.data, user.id);
    if (!invoice) throw new DomainRuleError("Factura no encontrada");
    revalidatePath("/finance");
    return invoice;
  });
}

/** Borrado — SOLO facturas manuales. */
export async function deleteInvoice(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await runAction("finance", "write", async () => {
    const existing = await repo.findInvoiceRow(id);
    if (!existing) throw new DomainRuleError("Factura no encontrada");
    if (existing.source !== "manual") {
      throw new DomainRuleError(
        "Las facturas sincronizadas de QuickBooks no se pueden borrar",
      );
    }
    return repo.deleteInvoiceById(id);
  });
  if (!result.ok) return result;
  if (!result.data) return actionError("Factura no encontrada");
  revalidatePath("/finance");
  return { ok: true, data: { id } };
}
