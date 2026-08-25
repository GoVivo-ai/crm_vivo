"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { DealCard } from "@/modules/crm/ui/pipeline/deal-card";
import {
  stageTotal,
  type BoardStage,
} from "@/modules/crm/ui/pipeline/board-state";
import { formatCompactMoney } from "@/shared/ui/format";

type StageColumnProps = {
  stage: BoardStage;
  accountNames: Map<string, string>;
  today: string; // YYYY-MM-DD, calculado por el server para pureza de render
};

export function StageColumn({ stage, accountNames, today }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <section
      className="flex w-64 shrink-0 flex-col rounded-lg border bg-secondary/40"
      aria-label={`Etapa ${stage.name}`}
    >
      <header
        className={cn(
          "flex items-baseline justify-between gap-2 border-b px-3 py-2",
          stage.isWon && "border-b-health-ok/40",
          stage.isLost && "border-b-destructive/30",
        )}
      >
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-sm font-semibold">{stage.name}</h2>
          <span className="text-xs text-muted-foreground">
            {stage.deals.length}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {formatCompactMoney(stageTotal(stage))}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-accent",
        )}
      >
        <SortableContext
          items={stage.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              accountName={accountNames.get(deal.accountId) ?? "—"}
              overdue={
                deal.expectedCloseDate !== null &&
                deal.closedAt === null &&
                deal.expectedCloseDate < today
              }
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
