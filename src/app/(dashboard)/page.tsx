import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import type { SyncSource } from "@/modules/finance/domain/types";
import { SyncStatus } from "@/shared/ui/sync-status";

const SOURCE_LABELS: Record<SyncSource, string> = {
  alegra: "Alegra",
  clickup: "ClickUp",
  windsor: "Windsor",
};

export default async function DashboardHome() {
  const syncResult = await getSyncStatus();
  const sync = syncResult.ok ? syncResult.data : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">360</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Home ejecutivo (Fase 5): pipeline y forecast, MRR, cartera vencida,
        spend de ads y salud de proyectos — todo desde Postgres.
      </p>
      <div className="mt-6 flex flex-col gap-2 rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Estado de las fuentes</p>
        {(Object.keys(SOURCE_LABELS) as SyncSource[]).map((source) => {
          const run = sync?.[source] ?? null;
          return (
            <SyncStatus
              key={source}
              source={SOURCE_LABELS[source]}
              syncedAt={run?.status === "success" ? run.finishedAt : null}
              error={run?.status === "error" ? run.error : null}
            />
          );
        })}
      </div>
    </div>
  );
}
