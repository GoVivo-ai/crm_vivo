import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { projects } from "@/modules/clients/schema";
import type { Project } from "@/modules/clients/domain/types";
import type { ProjectInput } from "@/modules/clients/domain/validation";

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    clickupListId: row.clickupListId,
    health: row.health,
    syncedProgress: row.syncedProgress,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

export async function listProjectsForAccount(
  accountId: string,
): Promise<Project[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.accountId, accountId))
    .orderBy(asc(projects.name));
  return rows.map(toProject);
}

export async function insertProject(input: ProjectInput): Promise<Project> {
  const rows = await db
    .insert(projects)
    .values({
      accountId: input.accountId,
      name: input.name,
      clickupListId: input.clickupListId ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    })
    .returning();
  return toProject(rows[0]);
}
