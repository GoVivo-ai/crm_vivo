import { SyncStatus } from "@/shared/ui/sync-status";

export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">360</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Home ejecutivo (Fase 5): pipeline y forecast, MRR, cartera vencida,
        spend de ads y salud de proyectos — todo desde Postgres.
      </p>
      <div className="mt-6 flex flex-col gap-2 rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Estado de las fuentes</p>
        <SyncStatus source="Alegra" syncedAt={null} />
        <SyncStatus source="ClickUp" syncedAt={null} />
        <SyncStatus source="Windsor" syncedAt={null} />
      </div>
    </div>
  );
}
