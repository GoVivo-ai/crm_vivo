"use server";

import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import type {
  CashflowPoint,
  FinanceDashboard,
  IntegrationSyncStatus,
  PnlPoint,
  SyncSource,
} from "@/modules/finance/domain/types";
import * as repo from "@/modules/finance/infrastructure/finance-repository";
import { getLastRunPerSource } from "@/modules/finance/infrastructure/sync-status-repository";

const currentMonth = () => new Date().toISOString().slice(0, 7);

/** Dashboard de Finanzas (finance:read) — todo calculado de registros
 * propios (manual + QuickBooks). */
export async function getFinanceDashboard(): Promise<
  ActionResult<FinanceDashboard>
> {
  return runAction("finance", "read", async () => {
    const [billing, receivables, pnl, cashflow] = await Promise.all([
      repo.getMonthlyBilling(12),
      repo.getReceivables(),
      repo.getPnlByMonth(1),
      repo.getCashflowByMonth(1),
    ]);
    return {
      billing,
      receivables,
      pnlCurrentMonth: pnl.find((p) => p.month === currentMonth()) ?? null,
      cashflowCurrentMonth:
        cashflow.find((c) => c.month === currentMonth()) ?? null,
    };
  });
}

/** Serie mensual de P&L calculado (default 12 meses). */
export async function getPnlSeries(
  months: number = 12,
): Promise<ActionResult<PnlPoint[]>> {
  return runAction("finance", "read", () =>
    repo.getPnlByMonth(Math.min(Math.max(months, 1), 36)),
  );
}

/** Serie mensual de flujo de caja registrado (default 12 meses). */
export async function getCashflowSeries(
  months: number = 12,
): Promise<ActionResult<CashflowPoint[]>> {
  return runAction("finance", "read", () =>
    repo.getCashflowByMonth(Math.min(Math.max(months, 1), 36)),
  );
}

/** Pulso de sincronización — cualquier usuario activo. */
export async function getSyncStatus(): Promise<
  ActionResult<Record<SyncSource, IntegrationSyncStatus | null>>
> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesión no válida");
  try {
    return actionOk(await getLastRunPerSource());
  } catch (error) {
    console.error("[finance getSyncStatus]", error);
    return actionError("Error inesperado, intenta de nuevo");
  }
}
