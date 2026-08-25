"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type { Project } from "@/modules/clients/domain/types";
import { projectInputSchema } from "@/modules/clients/domain/validation";
import * as repo from "@/modules/clients/infrastructure/projects-repository";

export async function listProjectsForAccount(
  accountId: string,
): Promise<ActionResult<Project[]>> {
  return runAction("clients", "read", () =>
    repo.listProjectsForAccount(accountId),
  );
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<Project>> {
  const parsed = parseInput(projectInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runAction("clients", "write", async () => {
    const project = await repo.insertProject(parsed.data);
    revalidatePath("/clients");
    return project;
  });
}
