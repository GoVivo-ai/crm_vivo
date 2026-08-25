import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SyncSource } from "@/modules/finance/domain/types";
import { listSyncRuns } from "@/modules/settings/application/sync-runs-action";

const SOURCE_LABELS: Record<SyncSource, string> = {
  quickbooks: "QuickBooks",
  meta_ads: "Meta Ads",
  clickup: "ClickUp",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  success: {
    label: "OK",
    className: "border-health-ok/30 bg-health-ok/10 text-health-ok",
  },
  running: {
    label: "Corriendo",
    className: "border-[#1E5FBF]/30 bg-[#E8F0FB] text-[#1E5FBF]",
  },
  error: {
    label: "Error",
    className:
      "border-health-critical/30 bg-health-critical/10 text-health-critical",
  },
};

const time = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

function duration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)} s` : `${(s / 60).toFixed(1)} min`;
}

/** Historial de corridas de sincronización (listSyncRuns, solo admin). */
export async function SyncRunsPanel() {
  const result = await listSyncRuns({ limit: 20 });
  if (!result.ok) return null;

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Historial de corridas</h2>
      <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
        Las 20 más recientes, con duración y filas procesadas.
      </p>
      {result.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay corridas — conecta una integración y sincroniza.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fuente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="text-right">Duración</TableHead>
              <TableHead className="text-right">Filas</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((run) => {
              const badge = STATUS_BADGE[run.status] ?? STATUS_BADGE.error;
              return (
                <TableRow key={run.id}>
                  <TableCell className="text-sm font-medium">
                    {SOURCE_LABELS[run.source as SyncSource] ?? run.source}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {time.format(run.startedAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {duration(run.durationMs)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {run.rowsProcessed ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                    {run.error ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
