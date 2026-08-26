import { cn } from "@/lib/utils";
import type { Project } from "@/modules/clients/domain/types";
import { HealthBadge } from "@/modules/clients/ui/health-badge";
import { ProjectForm } from "@/modules/clients/ui/project-form";
import { RequiresWrite } from "@/shared/ui/requires-write";
import { formatIsoDate } from "@/modules/people/ui/file/helpers";

type Progress = {
  done?: number;
  inProgress?: number;
  open?: number;
  overdue?: number;
};

function parseProgress(raw: unknown): Progress | null {
  if (raw === null || typeof raw !== "object") return null;
  return raw as Progress;
}

/** Proyectos del 360 (artboard): barra de progreso desde el sync de
 * ClickUp cuando existe; sin sync, salud + nota honesta. */
export function ProjectsCard({
  accountId,
  projects,
}: {
  accountId: string;
  projects: Project[];
}) {
  const synced = projects.some((p) => p.clickupListId !== null);

  return (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex flex-wrap items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          Proyectos
        </h2>
        {synced && (
          <span className="rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85]">
            Sincronizado con ClickUp
          </span>
        )}
        <span className="ml-auto">
          <RequiresWrite resource="clients">
            <ProjectForm accountId={accountId} />
          </RequiresWrite>
        </span>
      </div>
      {projects.length === 0 ? (
        <p className="px-5 pt-2.5 pb-4 text-xs font-semibold text-muted-foreground">
          Sin proyectos todavía.
        </p>
      ) : (
        <div className="flex flex-col px-5 pt-1.5 pb-3.5">
          {projects.map((project) => {
            const progress = parseProgress(project.syncedProgress);
            const total =
              (progress?.done ?? 0) +
              (progress?.inProgress ?? 0) +
              (progress?.open ?? 0);
            const pct =
              progress && total > 0
                ? Math.round(((progress.done ?? 0) / total) * 100)
                : null;
            const overdue = (progress?.overdue ?? 0) > 0;
            return (
              <div
                key={project.id}
                className="flex flex-wrap items-center gap-3 border-b border-[#EDF0F5] py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold">{project.name}</p>
                  <p className="text-[11.5px] font-semibold text-muted-foreground">
                    {[
                      project.endDate
                        ? `Vence ${formatIsoDate(project.endDate)}`
                        : null,
                      pct !== null
                        ? `${progress?.done ?? 0}/${total} tareas`
                        : project.clickupListId === null
                          ? "Sin sync de ClickUp"
                          : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                {pct !== null && (
                  <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-[#EEF1F6]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        overdue ? "bg-[#8C7A0A]" : "bg-[#04D98B]",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                <HealthBadge health={project.health} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
