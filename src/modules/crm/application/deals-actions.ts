"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/actions/result";
import { actionError } from "@/shared/actions/result";
import { DomainRuleError } from "@/shared/actions/errors";
import type { Deal, PipelineBoard } from "@/modules/crm/domain/types";
import {
  dealInputSchema,
  moveDealSchema,
} from "@/modules/crm/domain/validation";
import * as repo from "@/modules/crm/infrastructure/deals-repository";
import {
  insertStageEvent,
  listStageHistory,
  type StageEventView,
} from "@/modules/crm/infrastructure/stage-events-repository";
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

/** Historial de transiciones de etapa del negocio (crm:read). */
export async function listDealStageHistory(
  dealId: string,
): Promise<ActionResult<StageEventView[]>> {
  return runCrmAction("read", () => listStageHistory(dealId));
}

export async function getDeal(id: string): Promise<ActionResult<Deal>> {
  return runCrmAction("read", async () => {
    const deal = await repo.findDealById(id);
    if (!deal) throw new DomainRuleError("Deal no encontrado");
    return deal;
  });
}

export async function createDeal(
  input: unknown,
): Promise<ActionResult<Deal>> {
  const parsed = parseInput(dealInputSchema, input);
  if (!parsed.ok) return parsed.result;
  return runCrmAction("write", async (user) => {
    const deal = await repo.insertDeal(parsed.data);
    await insertStageEvent({
      dealId: deal.id,
      fromStageId: null,
      toStageId: deal.stageId,
      movedBy: user.id,
    });
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
  const result = await runCrmAction("write", async (user) => {
    const stage = await repo.findStageById(stageId);
    if (!stage) throw new Error("Etapa no encontrada");
    const previous = await repo.findDealById(dealId);
    const closedAt = stage.isWon || stage.isLost ? new Date() : null;
    const moved = await repo.moveDeal(dealId, stageId, position, closedAt);
    if (moved && previous && previous.stageId !== stageId) {
      await insertStageEvent({
        dealId,
        fromStageId: previous.stageId,
        toStageId: stageId,
        movedBy: user.id,
      });
    }
    return moved;
  });
  if (result.ok && result.data === null) {
    return actionError("Deal no encontrado");
  }
  revalidatePath("/crm");
  return result as ActionResult<Deal>;
}
