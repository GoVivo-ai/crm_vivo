import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import type { SyncSource } from "@/modules/finance/domain/types";

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

/** Última corrida de sync por fuente (el historial completo vendrá de
 * backend cuando exista listSyncRuns — no se simula). */
export async function SyncRunsPanel() {
  const result = await getSyncStatus();
  if (!result.ok) return null;

  const rows = (Object.keys(SOURCE_LABELS) as SyncSource[])
    .map((source) => ({ source, run: result.data[source] }))
    .filter((r) => r.run !== null);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Últimas corridas</h2>
      <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
        La corrida más reciente de cada fuente.
      </p>
      {rows.length === 0 ? (
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
              <TableHead>Fin</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ source, run }) => {
              const badge = STATUS_BADGE[run!.status] ?? STATUS_BADGE.error;
              return (
                <TableRow key={source}>
                  <TableCell className="text-sm font-medium">
                    {SOURCE_LABELS[source]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {time.format(run!.startedAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {run!.finishedAt ? time.format(run!.finishedAt) : "—"}
                  </TableCell>
                  <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                    {run!.error ?? "—"}
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
