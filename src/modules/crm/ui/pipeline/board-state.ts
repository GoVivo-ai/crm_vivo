import type { Deal, PipelineStage } from "@/modules/crm/domain/types";

export type BoardStage = PipelineStage & { deals: Deal[] };

/** Etapa que contiene el id (de etapa o de deal); null si no existe. */
export function findStageId(
  stages: BoardStage[],
  id: string,
): string | null {
  for (const stage of stages) {
    if (stage.id === id) return stage.id;
    if (stage.deals.some((d) => d.id === id)) return stage.id;
  }
  return null;
}

export function findDeal(stages: BoardStage[], dealId: string): Deal | null {
  for (const stage of stages) {
    const deal = stage.deals.find((d) => d.id === dealId);
    if (deal) return deal;
  }
  return null;
}

/**
 * Mueve un deal a una etapa/índice y retorna un tablero nuevo (inmutable).
 * Índice fuera de rango = al final de la columna.
 */
export function moveDeal(
  stages: BoardStage[],
  dealId: string,
  toStageId: string,
  toIndex: number,
): BoardStage[] {
  const deal = findDeal(stages, dealId);
  if (!deal) return stages;

  return stages.map((stage) => {
    const without = stage.deals.filter((d) => d.id !== dealId);
    if (stage.id !== toStageId) return { ...stage, deals: without };
    const index = Math.max(0, Math.min(toIndex, without.length));
    return {
      ...stage,
      deals: [
        ...without.slice(0, index),
        { ...deal, stageId: toStageId },
        ...without.slice(index),
      ],
    };
  });
}

export function stageTotal(stage: BoardStage): number {
  return stage.deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
}
