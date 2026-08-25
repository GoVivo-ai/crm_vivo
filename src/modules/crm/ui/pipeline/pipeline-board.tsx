"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { moveDealToStage } from "@/modules/crm/application/deals-actions";
import {
  screenReaderInstructions,
  useBoardAnnouncements,
} from "@/modules/crm/ui/pipeline/board-a11y";
import {
  findDeal,
  findStageId,
  moveDeal,
  type BoardStage,
} from "@/modules/crm/ui/pipeline/board-state";
import { DealCardContent } from "@/modules/crm/ui/pipeline/deal-card";
import { StageColumn } from "@/modules/crm/ui/pipeline/stage-column";

type PipelineBoardProps = {
  initialStages: BoardStage[];
  accountNames: Map<string, string>;
  today: string;
};

export function PipelineBoard({
  initialStages,
  accountNames,
  today,
}: PipelineBoardProps) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  // Snapshot al iniciar el drag, para rollback si el server rechaza el move.
  const snapshot = useRef<BoardStage[]>(initialStages);
  const announcements = useBoardAnnouncements(stages);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart({ active }: DragStartEvent) {
    snapshot.current = stages;
    setActiveDealId(String(active.id));
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findStageId(stages, String(active.id));
    const to = findStageId(stages, String(over.id));
    if (!from || !to || from === to) return;
    // Cruce de columna durante el drag: mover en vivo para previsualizar.
    const overStage = stages.find((s) => s.id === to);
    const overIndex = overStage?.deals.findIndex((d) => d.id === over.id) ?? -1;
    const index = overIndex >= 0 ? overIndex : (overStage?.deals.length ?? 0);
    setStages((prev) => moveDeal(prev, String(active.id), to, index));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveDealId(null);
    if (!over) {
      setStages(snapshot.current);
      return;
    }
    const dealId = String(active.id);
    const to = findStageId(stages, String(over.id));
    if (!to) return;

    const overStage = stages.find((s) => s.id === to);
    const overIndex =
      overStage?.deals.findIndex((d) => d.id === over.id) ?? -1;
    const index =
      String(over.id) === to
        ? (overStage?.deals.length ?? 0)
        : Math.max(0, overIndex);

    const next = moveDeal(stages, dealId, to, index);
    const position = next
      .find((s) => s.id === to)!
      .deals.findIndex((d) => d.id === dealId);
    setStages(next);

    void moveDealToStage({ dealId, stageId: to, position })
      .then((result) => {
        if (result.ok) {
          router.refresh();
        } else {
          setStages(snapshot.current);
          toast.error(result.error);
        }
      })
      .catch(() => {
        // Rechazo fuera del contrato (red caída, server down): rollback.
        setStages(snapshot.current);
        toast.error("No se pudo mover el deal");
      });
  }

  const activeDeal = activeDealId ? findDeal(stages, activeDealId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setStages(snapshot.current);
        setActiveDealId(null);
      }}
    >
      <div className="flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            accountNames={accountNames}
            today={today}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="rotate-2 opacity-95 shadow-lg motion-reduce:rotate-0">
            <DealCardContent
            deal={activeDeal}
            accountName={accountNames.get(activeDeal.accountId) ?? "—"}
            overdue={false}
            today={today}
          />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
