"use server";

import { z } from "zod";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { PurchasesDashboard } from "@/modules/purchases/domain/types";
import * as repo from "@/modules/purchases/infrastructure/purchases-repository";

const periodSchema = z
  .object({
    from: z.iso.date().nullish(),
    to: z.iso.date().nullish(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "El rango de fechas es inválido",
    path: ["from"],
  });

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function resolvePeriod(from?: string | null, to?: string | null) {
  const now = new Date();
  return {
    from: from ?? `${isoDate(now).slice(0, 8)}01`, // inicio del mes en curso
    to: to ?? isoDate(now),
  };
}

/** Dashboard de Gastos y compras (purchases:read = finance/management/admin).
 * Gasto mensual 12m, y por centro de costo / proveedor en el periodo
 * (default: mes en curso). Cuentas por pagar con aging, siempre vivas. */
export async function getPurchasesDashboard(
  input: unknown = {},
): Promise<ActionResult<PurchasesDashboard>> {
  const parsed = parseInput(periodSchema, input);
  if (!parsed.ok) return parsed.result;
  const period = resolvePeriod(parsed.data.from, parsed.data.to);

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
