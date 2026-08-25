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
    // Columna del artboard PipelineCRM: pista #EEF1F6, radio 14, sin rieles.
    <section
      className="flex w-64 shrink-0 flex-col rounded-[14px] bg-[#EEF1F6] p-1"
      aria-label={`Etapa ${stage.name}`}
    >
      <header className="flex items-baseline justify-between gap-2 px-3 pt-2 pb-1">
        <div className="flex items-baseline gap-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold">
            {stage.name}
          </h2>
          <span className="rounded-full bg-card px-1.5 text-xs font-semibold text-muted-foreground">
            {stage.deals.length}
          </span>
        </div>
        {/* Suma en Nunito Sans tabular — la mono es para cifras de datos,
         * no para totales de cabecera (M6). */}
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          {formatCompactMoney(stageTotal(stage))}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-[12px] p-2 transition-colors",
          // Dropzone del spec: borde punteado #C6CFDD.
          isOver && "outline-2 outline-dashed outline-[#C6CFDD]",
        )}
      >
        <SortableContext
          items={stage.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Columna vacía: slot punteado del artboard — la creación real
           * vive en el botón "+ Nuevo negocio" de la página (M6). */}
          {stage.deals.length === 0 && !stage.isWon && !stage.isLost && (
            <div className="grid h-16 place-items-center rounded-[12px] border-2 border-dashed border-[#C6CFDD] text-xs font-bold text-muted-foreground">
              + Nuevo negocio
            </div>
          )}
          {stage.deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              today={today}
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
