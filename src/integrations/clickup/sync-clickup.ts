import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { projects } from "@/modules/clients/schema";
import { runSync, type SyncStats } from "@/integrations/shared/sync-run";
import { toReadableSyncError } from "@/integrations/shared/errors";
import { fetchListTasks } from "@/integrations/clickup/clickup-client";
import type {
  ClickUpTask,
  ProjectProgress,
} from "@/integrations/clickup/types";

function computeProgress(tasks: ClickUpTask[]): ProjectProgress {
  const now = Date.now();
  const byStatus: Record<string, number> = {};
  let done = 0;
  let inProgress = 0;
  let open = 0;
  let overdue = 0;

  for (const task of tasks) {
    const label = task.status.status;
    byStatus[label] = (byStatus[label] ?? 0) + 1;
    const isDone = task.status.type === "done" || task.status.type === "closed";
    if (isDone) done++;
    else if (task.status.type === "custom") inProgress++;
    else open++;
    if (!isDone && task.due_date && Number(task.due_date) < now) overdue++;
  }

  return {
    total: tasks.length,
    done,
    inProgress,
    open,
    overdue,
    completionPct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    byStatus,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Recalcula projects.synced_progress para cada proyecto vinculado a una
 * lista de ClickUp (folder=cliente, list=proyecto). Un proyecto que falla
 * (lista borrada, permisos) no bloquea el resto; queda en stats.errors.
 */
export async function syncClickUp(): Promise<{
  runId: string;
  stats: SyncStats;
}> {
  return runSync("clickup", async () => {
    const linked = await db
      .select({ id: projects.id, clickupListId: projects.clickupListId })
      .from(projects)
      .where(isNotNull(projects.clickupListId));

    let synced = 0;
    const errors: Record<string, string> = {};

    for (const project of linked) {
      try {
        const tasks = await fetchListTasks(project.clickupListId as string);
        await db
          .update(projects)
          .set({ syncedProgress: computeProgress(tasks) })
          .where(eq(projects.id, project.id));
        synced++;
      } catch (error) {
        errors[project.id] = toReadableSyncError(error);
      }
    }

    return { projectsLinked: linked.length, projectsSynced: synced, errors };
  });
}
