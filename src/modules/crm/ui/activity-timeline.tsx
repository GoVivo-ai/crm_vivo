"use client";

import {
  Mail,
  NotebookPen,
  Phone,
  SquareCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Activity, ActivityType } from "@/modules/crm/domain/types";
import { formatDate, formatRelativeTime } from "@/shared/ui/format";

/** Hito de sistema (§15.1): se registra solo — p.ej. cambio de etapa. */
export type TimelineMilestone = {
  id: string;
  title: string;
  at: Date;
  /** Autor resuelto ("quién · cuándo"); null = sin autor conocido. */
  by?: string | null;
};

// Tintas por tipo (§15.1): nota gris, llamada azul, reunión teal,
// correo gold, tarea neutra, cambio de etapa VERDE.
const DOT: Record<
  ActivityType | "milestone",
  { icon: typeof Phone; bg: string; fg: string }
> = {
  note: { icon: NotebookPen, bg: "#EEF1F6", fg: "#5A6B85" },
  call: { icon: Phone, bg: "#E8F0FB", fg: "#1E5FBF" },
  meeting: { icon: Users, bg: "#E0F2F6", fg: "#0790A8" },
  email: { icon: Mail, bg: "#FBF7D9", fg: "#8C7A0A" },
  task: { icon: SquareCheck, bg: "#EEF1F6", fg: "#5A6B85" },
  milestone: { icon: TrendingUp, bg: "#E6F9F1", fg: "#069B66" },
};

type Entry = {
  id: string;
  kind: ActivityType | "milestone";
  title: string;
  body: string | null;
  at: Date;
  by?: string | null;
  /** Tarea pendiente: fecha límite visible en gold. */
  due?: Date | null;
};

const VISIBLE = 8;

/** Timeline canónico (§15.1): rail 2px, puntos 20 de tinta por tipo,
 * firma "cuándo relativo" (absoluto en tooltip), "Ver más" tras 8. */
export function ActivityTimeline({
  activities,
  milestones = [],
  authors = {},
}: {
  activities: Activity[];
  milestones?: TimelineMilestone[];
  /** ownerId → nombre (listUserNames), para la firma "quién". */
  authors?: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const entries: Entry[] = [
    ...activities.map((a) => ({
      id: a.id,
      kind: a.type as Entry["kind"],
      title: a.subject,
      body: a.content,
      at: a.createdAt,
      by: a.ownerId ? (authors[a.ownerId] ?? null) : null,
      due: a.completedAt === null ? a.dueDate : null,
    })),
    ...milestones.map((m) => ({
      id: m.id,
      kind: "milestone" as const,
      title: m.title,
      body: null,
      at: m.at,
      by: m.by ?? null,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  if (entries.length === 0) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        Sin actividades todavía. Registra la primera llamada, reunión o nota.
      </p>
    );
  }
  const visible = expanded ? entries : entries.slice(0, VISIBLE);

  return (
    <div className="relative pl-[26px] before:absolute before:top-1.5 before:bottom-1.5 before:left-[9px] before:w-0.5 before:rounded-full before:bg-[#EDF0F5]">
      <ol className="flex flex-col">
        {visible.map((entry) => {
          const dot = DOT[entry.kind];
          const Icon = dot.icon;
          return (
            <li key={entry.id} className="relative pb-4 last:pb-0.5">
              <span
                className="absolute top-0.5 -left-[26px] grid size-5 place-items-center rounded-full border-2 border-card"
                style={{ background: dot.bg, color: dot.fg }}
              >
                <Icon className="size-2.5" strokeWidth={2.4} />
              </span>
              <p className="text-[12.5px] font-extrabold">{entry.title}</p>
              {entry.due && (
                <p className="mt-0.5 text-[11px] font-bold text-[#8C7A0A]">
                  Vence {formatDate(entry.due)}
                </p>
              )}
              {entry.body && (
                <p className="mt-0.5 text-xs font-semibold whitespace-pre-wrap text-muted-foreground">
                  {entry.body}
                </p>
              )}
              <p
                className="mt-0.5 text-[11px] font-semibold text-[#8B99B0]"
                title={formatDate(entry.at)}
              >
                {entry.by ? `${entry.by} · ` : ""}
                {formatRelativeTime(entry.at)}
              </p>
            </li>
          );
        })}
      </ol>
      {entries.length > VISIBLE && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs font-extrabold text-[#069B66] hover:text-[#045C3D]"
        >
          Ver más ({entries.length - VISIBLE}) →
        </button>
      )}
    </div>
  );
}
