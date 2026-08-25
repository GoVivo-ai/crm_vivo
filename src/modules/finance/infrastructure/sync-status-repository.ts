import { desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncRuns } from "@/shared/database/sync-runs.schema";
import type {
  IntegrationSyncStatus,
  SyncSource,
} from "@/modules/finance/domain/types";

const SOURCES: SyncSource[] = ["quickbooks", "clickup", "meta_ads"];

/** Última corrida registrada de cada integración (null si nunca corrió). */
export async function getLastRunPerSource(): Promise<
  Record<SyncSource, IntegrationSyncStatus | null>
> {
  const result = {} as Record<SyncSource, IntegrationSyncStatus | null>;
  for (const source of SOURCES) {
    const rows = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.source, source))
      .orderBy(desc(syncRuns.startedAt))
      .limit(1);
    const row = rows[0];
    result[source] = row
      ? {
          source,
          status: row.status,
          startedAt: row.startedAt,
          finishedAt: row.finishedAt,
          error: row.error,
          stats: row.stats,
        }
      : null;
  }
  return result;
}

export type SyncRunView = {
  id: string;
  source: SyncSource;
  status: "running" | "success" | "error";
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  /** stats.rowsProcessed si Integraciones lo escribe; si no, suma de los
   * valores numéricos top-level de stats (conteos por entidad). */
  rowsProcessed: number | null;
  error: string | null;
  stats: unknown;
};

function deriveRows(stats: unknown): number | null {
  if (!stats || typeof stats !== "object") return null;
  const record = stats as Record<string, unknown>;
  if (typeof record.rowsProcessed === "number") return record.rowsProcessed;
  const numbers = Object.entries(record)
    .filter(([key]) => !/cursor|scope|since|page/i.test(key))
    .map(([, v]) => v)
    .filter((v): v is number => typeof v === "number");
  return numbers.length ? numbers.reduce((a, b) => a + b, 0) : null;
}

/** Historial de corridas de sync, más recientes primero. */
export async function listSyncRunHistory(limit: number): Promise<SyncRunView[]> {
  const rows = await db
    .select()
    .from(syncRuns)
    .orderBy(desc(syncRuns.startedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    status: r.status,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    durationMs: r.finishedAt
      ? r.finishedAt.getTime() - r.startedAt.getTime()
      : null,
    rowsProcessed: deriveRows(r.stats),
    error: r.error,
    stats: r.stats,
  }));
}
