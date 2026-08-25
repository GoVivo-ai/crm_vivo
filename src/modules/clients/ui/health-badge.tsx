import { cn } from "@/lib/utils";
import type { ProjectHealth } from "@/modules/clients/domain/types";

const HEALTH_LABELS: Record<ProjectHealth, string> = {
  green: "Al día",
  yellow: "En riesgo",
  red: "Crítico",
  unknown: "Sin datos",
};

const HEALTH_DOT: Record<ProjectHealth, string> = {
  green: "bg-health-ok",
  yellow: "bg-health-warn",
  red: "bg-health-critical",
  unknown: "bg-muted-foreground/40",
};

/** Semáforo de salud de proyecto (alimentado por el sync de ClickUp). */
export function HealthBadge({ health }: { health: ProjectHealth }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span aria-hidden className={cn("size-2 rounded-full", HEALTH_DOT[health])} />
      {HEALTH_LABELS[health]}
    </span>
  );
}
