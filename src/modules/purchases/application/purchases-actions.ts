"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { DomainRuleError } from "@/shared/actions/errors";
import { actionError, type ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  Expense,
  PurchasesDashboard,
} from "@/modules/purchases/domain/types";
import {
  expenseInputSchema,
  expenseListFilterSchema,
  type ExpenseListFilter,
} from "@/modules/purchases/domain/validation";
import * as repo from "@/modules/purchases/infrastructure/purchases-repository";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const periodSchema = z
  .object({ from: z.iso.date().nullish(), to: z.iso.date().nullish() })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "El rango de fechas es inválido",
    path: ["from"],
  });

/** Dashboard de Gastos (purchases:read): gasto mensual 12m, por centro
 * de costo y proveedor del periodo (default mes en curso), CxP con aging. */
export async function getPurchasesDashboard(
  input: unknown = {},
): Promise<ActionResult<PurchasesDashboard>> {
  const parsed = parseInput(periodSchema, input);
  if (!parsed.ok) return parsed.result;
  const now = new Date();
  const period = {
    from: parsed.data.from ?? `${isoDate(now).slice(0, 8)}01`,
    to: parsed.data.to ?? isoDate(now),
  };
  return runAction("purchases", "read", async () => {
    const [spendByMonth, byCostCenter, byProvider, payables] =
      await Promise.all([
        repo.getMonthlySpend(12),
        repo.getSpendByCostCenter(period),
        repo.getSpendByProvider(period, 20),
        repo.getPayables(),
      ]);
    return { period, spendByMonth, byCostCenter, byProvider, payables };
  });
}

export async function listExpenses(
  filter: ExpenseListFilter = {},
): Promise<ActionResult<Expense[]>> {
  const parsed = parseInput(expenseListFilterSchema, filter);
  if (!parsed.ok) return parsed.result;
  return runAction("purchases", "read", () => repo.listExpenses(parsed.data));
}

/** Registro manual de gasto/factura de proveedor (purchases:write). */
export async function createExpense(
  input: unknown,
): Promise<ActionResult<Expense>> {
  const parsed = parseInput(expenseInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("purchases", "write", async (user) => {
    const expense = await repo.insertExpense(parsed.data, user.id);
    revalidatePath("/purchases");
    return expense;
  });
}

async function assertManual(id: string) {
  const existing = await repo.findExpenseRow(id);
  if (!existing) throw new DomainRuleError("Gasto no encontrado");
  if (existing.source !== "manual") {
    throw new DomainRuleError(
      "Los gastos sincronizados de QuickBooks son de solo lectura",
    );
  }
}

export async function updateExpense(
  id: string,
  input: unknown,
): Promise<ActionResult<Expense>> {
  const parsed = parseInput(expenseInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("purchases", "write", async (user) => {
    await assertManual(id);
    const expense = await repo.updateExpenseById(id, parsed.data, user.id);
    if (!expense) throw new DomainRuleError("Gasto no encontrado");
    revalidatePath("/purchases");
    return expense;
  });
}

export async function deleteExpense(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await runAction("purchases", "write", async () => {
    await assertManual(id);
    return repo.deleteExpenseById(id);
  });
  if (!result.ok) return result;
  if (!result.data) return actionError("Gasto no encontrado");
  revalidatePath("/purchases");
  return { ok: true, data: { id } };
}
