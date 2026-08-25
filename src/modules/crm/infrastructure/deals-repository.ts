import { and, asc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "@/shared/database/db";
import { deals, pipelineStages } from "@/modules/crm/schema";
import type { Deal, PipelineBoard } from "@/modules/crm/domain/types";
import type { DealInput } from "@/modules/crm/domain/validation";
import { toDeal, toStage } from "@/modules/crm/infrastructure/mappers";

export async function getBoard(ownerId?: string | null): Promise<PipelineBoard> {
  const stageRows = await db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.position));
  const conditions: SQL[] = [];
  if (ownerId) conditions.push(eq(deals.ownerId, ownerId));
  const dealRows = await db
    .select()
    .from(deals)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(deals.position), asc(deals.createdAt));

  return {
    stages: stageRows.map((stage) => ({
      ...toStage(stage),
      deals: dealRows.filter((d) => d.stageId === stage.id).map(toDeal),
    })),
  };
}

export async function findDealById(id: string): Promise<Deal | null> {
  const rows = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return rows[0] ? toDeal(rows[0]) : null;
}

export async function listDealsForAccount(accountId: string): Promise<Deal[]> {
  const rows = await db
    .select()
    .from(deals)
    .where(eq(deals.accountId, accountId))
    .orderBy(asc(deals.createdAt));
  return rows.map(toDeal);
}

export async function findWonStage() {
  const rows = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.isWon, true))
    .limit(1);
  return rows[0] ? toStage(rows[0]) : null;
}

export async function findStageById(id: string) {
  const rows = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.id, id))
    .limit(1);
  return rows[0] ? toStage(rows[0]) : null;
}

function toRow(input: DealInput) {
  return {
    title: input.title,
    accountId: input.accountId,
    contactId: input.contactId ?? null,
    stageId: input.stageId,
    ownerId: input.ownerId ?? null,
    amount: input.amount != null ? String(input.amount) : null,
    currency: input.currency,
    expectedCloseDate: input.expectedCloseDate ?? null,
  };
}

export async function insertDeal(input: DealInput): Promise<Deal> {
  const rows = await db.insert(deals).values(toRow(input)).returning();
  return toDeal(rows[0]);
}

export async function updateDealById(
  id: string,
  input: DealInput,
): Promise<Deal | null> {
  const rows = await db
    .update(deals)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(deals.id, id))
    .returning();
  return rows[0] ? toDeal(rows[0]) : null;
}

/**
 * Mueve un deal a una etapa/posición: abre hueco desplazando +1 los deals
 * con position >= destino y fija stage/position/closedAt del deal.
 */
export async function moveDeal(
  dealId: string,
  stageId: string,
  position: number,
  closedAt: Date | null,
): Promise<Deal | null> {
  await db
    .update(deals)
    .set({ position: sql`${deals.position} + 1` })
    .where(and(eq(deals.stageId, stageId), gte(deals.position, position)));
  const rows = await db
    .update(deals)
    .set({ stageId, position, closedAt, updatedAt: new Date() })
    .where(eq(deals.id, dealId))
    .returning();
  return rows[0] ? toDeal(rows[0]) : null;
}
