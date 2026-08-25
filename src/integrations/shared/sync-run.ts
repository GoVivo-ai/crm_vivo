import { desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncRuns } from "@/shared/database/sync-runs.schema";
import { toReadableSyncError } from "@/integrations/shared/errors";

type SyncSource = "alegra" | "clickup" | "meta_ads";

export type SyncStats = Record<string, unknown>;

/**
 * Envuelve una sincronización con observabilidad en sync_runs:
 * crea la fila en "running", y la cierra en "success" o "error".
 * El callback recibe el id del run por si quiere persistir cursores parciales.
 */
export async function runSync(
  source: SyncSource,
  fn: (runId: string) => Promise<SyncStats>,
): Promise<{ runId: string; stats: SyncStats }> {
  const [run] = await db
    .insert(syncRuns)
    .values({ source, status: "running" })
    .returning({ id: syncRuns.id });

  try {
    const stats = await fn(run.id);
    await db
      .update(syncRuns)
      .set({ status: "success", finishedAt: new Date(), stats })
      .where(eq(syncRuns.id, run.id));
    return { runId: run.id, stats };
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        error: toReadableSyncError(error),
      })
      .where(eq(syncRuns.id, run.id));
    throw error;
  }
}

/** Guarda stats parciales (p. ej. cursor de backfill) sin cerrar el run. */
export async function saveRunStats(
  runId: string,
  stats: SyncStats,
): Promise<void> {
  await db.update(syncRuns).set({ stats }).where(eq(syncRuns.id, runId));
}

/**
 * Stats del último run terminado de una fuente (para retomar cursores).
 * `scope` separa corridas que comparten source (alegra core vs erp): cada
 * sync escribe stats.scope y aquí se filtra para no pisar cursores ajenos.
 * Runs antiguos sin scope cuentan como "core".
 */
export async function getLastStats(
  source: SyncSource,
  scope = "core",
): Promise<SyncStats | null> {
  const rows = await db
    .select({ stats: syncRuns.stats, status: syncRuns.status })
    .from(syncRuns)
    .where(eq(syncRuns.source, source))
    .orderBy(desc(syncRuns.startedAt))
    .limit(20);
  const finished = rows.find(
    (r) =>
      r.status !== "running" &&
      (((r.stats as SyncStats | null)?.scope as string | undefined) ??
        "core") === scope,
  );
  return (finished?.stats as SyncStats | null) ?? null;
}
