import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/shared/database/db";
import { dealStageEvents, pipelineStages } from "@/modules/crm/schema";

export type StageEventView = {
  id: string;
  dealId: string;
  fromStageName: string | null;
  toStageName: string;
  movedBy: string | null;
  movedAt: Date;
};

/** Best-effort: el historial nunca debe romper el movimiento del deal. */
export async function insertStageEvent(event: {
  dealId: string;
  fromStageId: string | null;
  toStageId: string;
  movedBy: string | null;
}): Promise<void> {
  try {
    await db.insert(dealStageEvents).values(event);
  } catch (error) {
    console.error("[crm stage-event]", error);
  }
}

export async function listStageHistory(
  dealId: string,
): Promise<StageEventView[]> {
  const fromStage = alias(pipelineStages, "from_stage");
  const rows = await db
    .select({
      id: dealStageEvents.id,
      dealId: dealStageEvents.dealId,
      fromStageName: fromStage.name,
      toStageName: pipelineStages.name,
      movedBy: dealStageEvents.movedBy,
      movedAt: dealStageEvents.movedAt,
    })
    .from(dealStageEvents)
    .innerJoin(pipelineStages, eq(dealStageEvents.toStageId, pipelineStages.id))
    .leftJoin(fromStage, eq(dealStageEvents.fromStageId, fromStage.id))
    .where(eq(dealStageEvents.dealId, dealId))
    .orderBy(asc(dealStageEvents.movedAt));
  return rows;
}
