"use server";

import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import type {
  CashflowSeriesPoint,
  CashflowSummary,
  FinanceDashboard,
  IntegrationSyncStatus,
  PnlSeriesPoint,
  PnlTotals,
  SyncSource,
} from "@/modules/finance/domain/types";
import * as repo from "@/modules/finance/infrastructure/finance-repository";
import { getLastRunPerSource } from "@/modules/finance/infrastructure/sync-status-repository";

type PnlJson = { totals?: PnlTotals } | null;
type CashflowJson = { summary?: CashflowSummary } | null;

/** Dashboard de Finanzas (solo finance/management/admin). */
export async function getFinanceDashboard(): Promise<
  ActionResult<FinanceDashboard>
> {
  return runAction("finance", "read", async () => {
    const [billing, receivables, snapshot] = await Promise.all([
      repo.getMonthlyBilling(12),
      repo.getReceivables(),
      repo.getLatestSnapshot(),
    ]);
    return {
      billing,
      receivables,
      pnlCurrentMonth: (snapshot?.pnl as PnlJson)?.totals ?? null,
      cashflowCurrentMonth:
        (snapshot?.cashflow as CashflowJson)?.summary ?? null,
      snapshotDate: snapshot?.snapshotDate ?? null,
    };
  });
}

/** Serie diaria de P&L desde finance_snapshots (default 90 días). */
export async function getPnlSeries(
  days: number = 90,
): Promise<ActionResult<PnlSeriesPoint[]>> {
  return runAction("finance", "read", async () => {
    const snapshots = await repo.getSnapshotsSince(Math.min(days, 366));
    return snapshots.flatMap((s) => {
      const totals = (s.pnl as PnlJson)?.totals;
      return totals ? [{ date: s.snapshotDate, totals }] : [];
    });
  });
}

/** Serie diaria de cashflow desde finance_snapshots (default 90 días). */
export async function getCashflowSeries(
  days: number = 90,
): Promise<ActionResult<CashflowSeriesPoint[]>> {
  return runAction("finance", "read", async () => {
    const snapshots = await repo.getSnapshotsSince(Math.min(days, 366));
    return snapshots.flatMap((s) => {
      const summary = (s.cashflow as CashflowJson)?.summary;
      return summary ? [{ date: s.snapshotDate, summary }] : [];
    });
  });
}

/**
 * Pulso de sincronización (última corrida por integración). Disponible
 * para cualquier usuario activo — no expone cifras, solo estado.
 */
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
