"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import type { Activity, Proposal } from "@/modules/crm/domain/types";
import {
  activityInputSchema,
  proposalInputSchema,
} from "@/modules/crm/domain/validation";
import * as repo from "@/modules/crm/infrastructure/activities-repository";
import {
  parseInput,
  runCrmAction,
} from "@/modules/crm/application/action-helpers";

export async function listActivitiesForDeal(
  dealId: string,
): Promise<ActionResult<Activity[]>> {
  return runCrmAction("read", () => repo.listActivitiesByDeal(dealId));
}

/** La actividad queda a nombre del usuario autenticado. */
export async function createActivity(
  input: unknown,
): Promise<ActionResult<Activity>> {
  const parsed = parseInput(activityInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async (user) => {
    const activity = await repo.insertActivity(parsed.data, user.id);
    revalidatePath("/crm");
    return activity;
  });
}

export async function listProposalsForDeal(
  dealId: string,
): Promise<ActionResult<Proposal[]>> {
  return runCrmAction("read", () => repo.listProposalsByDeal(dealId));
}

export async function createProposal(
  input: unknown,
): Promise<ActionResult<Proposal>> {
  const parsed = parseInput(proposalInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async () => {
    const proposal = await repo.insertProposal(parsed.data);
    revalidatePath("/crm");
    return proposal;
  });
}
