"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { actionError } from "@/shared/actions/result";
import type { Deal, PipelineBoard } from "@/modules/crm/domain/types";
import {
  dealInputSchema,
  moveDealSchema,
} from "@/modules/crm/domain/validation";
import * as repo from "@/modules/crm/infrastructure/deals-repository";
import {
  parseInput,
  runCrmAction,
} from "@/modules/crm/application/action-helpers";

/** Tablero Kanban completo; con ownerId filtra los deals de ese owner. */
export async function getPipelineBoard(
  ownerId?: string,
): Promise<ActionResult<PipelineBoard>> {
  return runCrmAction("read", () => repo.getBoard(ownerId ?? null));
}

export async function createDeal(
  input: unknown,
): Promise<ActionResult<Deal>> {
  const parsed = parseInput(dealInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async () => {
    const deal = await repo.insertDeal(parsed.data);
    revalidatePath("/crm");
    return deal;
  });
}

export async function updateDeal(
  id: string,
  input: unknown,
): Promise<ActionResult<Deal>> {
  const parsed = parseInput(dealInputSchema, input);
  if (!parsed.ok) return parsed.result;
  const result = await runCrmAction("write", () =>
    repo.updateDealById(id, parsed.data),
  );
  if (result.ok && result.data === null) {
    return actionError("Deal no encontrado");
  }
  revalidatePath("/crm");
  return result as ActionResult<Deal>;
}

/**
 * Mueve un deal en el Kanban. Si la etapa destino es ganada o perdida,
 * marca closedAt; si vuelve a una etapa abierta, lo reabre.
 */
export async function moveDealToStage(
  input: unknown,
): Promise<ActionResult<Deal>> {
  const parsed = parseInput(moveDealSchema, input);
  if (!parsed.ok) return parsed.result;
  const { dealId, stageId, position } = parsed.data;
  const result = await runCrmAction("write", async () => {
    const stage = await repo.findStageById(stageId);
    if (!stage) throw new Error("Etapa no encontrada");
    const closedAt = stage.isWon || stage.isLost ? new Date() : null;
    return repo.moveDeal(dealId, stageId, position, closedAt);
  });
  if (result.ok && result.data === null) {
    return actionError("Deal no encontrado");
  }
  revalidatePath("/crm");
  return result as ActionResult<Deal>;
}
