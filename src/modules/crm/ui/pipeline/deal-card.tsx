"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Deal } from "@/modules/crm/domain/types";
import { formatMoney } from "@/shared/ui/format";

type DealCardContentProps = {
  deal: Deal;
  accountName: string;
  overdue: boolean;
  /** Hoy (YYYY-MM-DD) desde el server, para calcular aging sin impurezas. */
  today: string;
};

const MONTH_SHORT = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");

/** "2026-09-05" → "5 sep". */
function shortDate(iso: string): string {
  const m = Number(iso.slice(5, 7));
  return `${Number(iso.slice(8, 10))} ${MONTH_SHORT[m - 1] ?? ""}`;
}

/** Días que el deal lleva en su etapa actual (stageEnteredAt de backend). */
function daysInStage(deal: Deal, today: string): number {
  const ms = Date.parse(`${today}T00:00:00Z`) - deal.stageEnteredAt.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Cuerpo visual de la card — compartido entre la lista y el DragOverlay. */
export function DealCardContent({
  deal,
  accountName,
  overdue,
  today,
}: DealCardContentProps) {
  const days = daysInStage(deal, today);
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-3 text-left shadow-xs transition-[box-shadow,translate] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <p className="text-sm leading-snug font-medium">{deal.title}</p>
      <p className="text-xs text-muted-foreground">{accountName}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs">
          {deal.amount !== null ? formatMoney(deal.amount) : "Sin monto"}
        </span>
        {deal.expectedCloseDate && (
          // Línea meta de calendario (canon del artboard): la forma aprobada
          // de destacar un cierre próximo — no lleva ring.
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "text-health-critical" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-3" />
            {overdue ? "Venció" : "Cierre"}: {shortDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>
      {deal.closedAt === null && (
        // Chip de días del artboard: faint; gold ≥10 d (estancado).
        <span
          className={cn(
            "ml-auto text-[10.5px] font-bold",
            days >= 10 ? "text-[#8C7A0A]" : "text-muted-foreground/70",
          )}
          title={days >= 10 ? "Estancado en la etapa" : "Días en la etapa"}
        >
          {days === 0 ? "hoy" : `${days} d`}
        </span>
      )}
    </div>
  );
}

type DealCardProps = DealCardContentProps;

export function DealCard({ deal, accountName, overdue, today }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/crm/deals/${deal.id}`}
        draggable={false}
        onClick={(e) => {
          // El click solo navega si no venimos de un drag.
          if (isDragging) e.preventDefault();
        }}
      >
        <DealCardContent
          deal={deal}
          accountName={accountName}
          overdue={overdue}
          today={today}
        />
      </Link>
    </div>
  );
}
