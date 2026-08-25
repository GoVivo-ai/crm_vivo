import { desc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { syncRuns } from "@/shared/database/sync-runs.schema";
import type {
  IntegrationSyncStatus,
  SyncSource,
} from "@/modules/finance/domain/types";

const SOURCES: SyncSource[] = ["alegra", "clickup", "windsor"];

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
