"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { moveDealToStage } from "@/modules/crm/application/deals-actions";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

export type StepperStage = {
  id: string;
  name: string;
  position: number;
  /** Posición para aterrizar al final de la etapa (calculada server). */
  nextPosition: number;
};

/**
 * Stepper de etapas (§15.1): pasadas en tinta verde con check, actual
 * navy sólida con glow, futuras neutras, conectores 14×2. Cambiar de
 * etapa se puede hacer aquí o arrastrando en el kanban.
 */
export function StageStepper({
  dealId,
  stages,
  currentStageId,
  canWrite,
}: {
  dealId: string;
  /** Etapas abiertas + la ganada, en orden; sin la perdida. */
  stages: StepperStage[];
  currentStageId: string;
  canWrite: boolean;
}) {
  const { submit, pending } = useActionSubmit<unknown>();
  const currentIdx = stages.findIndex((s) => s.id === currentStageId);

  function moveTo(stage: StepperStage) {
    if (!canWrite || pending || stage.id === currentStageId) return;
    submit(
      () =>
        moveDealToStage({
          dealId,
          stageId: stage.id,
          position: stage.nextPosition,
        }),
      { successMessage: `Movido a ${stage.name}` },
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EDF0F5] pt-4">
      {stages.map((stage, i) => {
        const done = currentIdx >= 0 && i < currentIdx;
        const current = stage.id === currentStageId;
        return (
          <span key={stage.id} className="flex items-center gap-2">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-0.5 w-3.5 rounded-full",
                  done || current ? "bg-[#04D98B]" : "bg-[#E3E8F0]",
                )}
              />
            )}
            <button
              type="button"
              disabled={!canWrite || pending || current}
              onClick={() => moveTo(stage)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-[#04D98B]",
                current
                  ? "bg-[#011640] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(1,22,64,0.45)]"
                  : done
                    ? "bg-[#E6F9F1] text-[#069B66]"
                    : "bg-[#EEF1F6] text-[#8B99B0]",
                canWrite && !current && "hover:text-[#011640]",
                !canWrite && "cursor-default",
              )}
            >
              {done && <Check className="size-[11px]" strokeWidth={3} />}
              {stage.name}
            </button>
          </span>
        );
      })}
      <span className="ml-auto hidden text-[11.5px] font-semibold text-[#8B99B0] lg:block">
        {canWrite
          ? "La etapa se cambia arrastrando en el pipeline o aquí"
          : "La etapa se cambia desde el pipeline"}
      </span>
    </div>
  );
}
