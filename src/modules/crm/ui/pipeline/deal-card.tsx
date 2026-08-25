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
};

/** Cuerpo visual de la card — compartido entre la lista y el DragOverlay. */
export function DealCardContent({
  deal,
  accountName,
  overdue,
}: DealCardContentProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border bg-card p-3 text-left shadow-xs">
      <p className="text-sm leading-snug font-medium">{deal.title}</p>
      <p className="text-xs text-muted-foreground">{accountName}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs">
          {deal.amount !== null ? formatMoney(deal.amount) : "Sin monto"}
        </span>
        {deal.expectedCloseDate && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "text-health-critical" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-3" />
            {deal.expectedCloseDate}
          </span>
        )}
      </div>
    </div>
  );
}

type DealCardProps = DealCardContentProps;

export function DealCard({ deal, accountName, overdue }: DealCardProps) {
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
        />
      </Link>
    </div>
  );
}
