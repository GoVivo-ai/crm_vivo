import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";
import {
  findDeal,
  findStageId,
  type BoardStage,
} from "@/modules/crm/ui/pipeline/board-state";

/** Anuncios aria-live del Kanban en español (dnd-kit trae inglés). */
export function makeAnnouncements(
  getStages: () => BoardStage[],
): Announcements {
  const dealTitle = (id: string | number) =>
    findDeal(getStages(), String(id))?.title ?? "el deal";
  const stageName = (id: string | number | undefined) => {
    if (id === undefined) return null;
    const stages = getStages();
    const stageId = findStageId(stages, String(id));
    return stages.find((s) => s.id === stageId)?.name ?? null;
  };

  return {
    onDragStart({ active }) {
      return `${dealTitle(active.id)} levantado.`;
    },
    onDragOver({ active, over }) {
      const stage = stageName(over?.id);
      return stage
        ? `${dealTitle(active.id)} sobre la etapa ${stage}.`
        : `${dealTitle(active.id)} fuera de las etapas.`;
    },
    onDragEnd({ active, over }) {
      const stage = stageName(over?.id);
      return stage
        ? `${dealTitle(active.id)} soltado en la etapa ${stage}.`
        : `${dealTitle(active.id)} soltado.`;
    },
    onDragCancel({ active }) {
      return `Movimiento cancelado. ${dealTitle(active.id)} vuelve a su etapa.`;
    },
  };
}

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Para mover un deal, presiona espacio o enter, usa las flechas para " +
    "cambiar de posición o etapa, y vuelve a presionar espacio o enter " +
    "para soltarlo. Presiona escape para cancelar.",
};
