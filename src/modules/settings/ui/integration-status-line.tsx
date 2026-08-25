// (geometría del spec: badges píldora — Badge ya es rounded-full)
import { Badge } from "@/components/ui/badge";
import type { IntegrationStatus } from "@/modules/settings/domain/types";
import { formatRelativeTime } from "@/shared/ui/format";
import { SyncStatus } from "@/shared/ui/sync-status";

/** Cabecera de estado de una integración: configuración, último test, sync. */
export function IntegrationStatusLine({
  status,
  label,
}: {
  status: IntegrationStatus;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {status.configured ? (
          <Badge
            variant="outline"
            className="border-health-ok/30 bg-health-ok/10 text-health-ok"
          >
            Configurada
          </Badge>
        ) : status.envFallbackAvailable ? (
          <Badge variant="outline" className="text-muted-foreground">
            Usando configuración del servidor
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-health-warn/30 bg-health-warn/10 text-health-warn"
          >
            Sin configurar
          </Badge>
        )}
        {status.hint && (
          <span className="font-mono text-xs text-muted-foreground">
            {status.hint}
          </span>
        )}
        {status.lastTest && (
          <span
            className={
              status.lastTest.ok
                ? "text-xs text-health-ok"
                : "text-xs text-health-critical"
            }
            title={status.lastTest.error ?? undefined}
          >
            {status.lastTest.ok
              ? `Conexión OK ${formatRelativeTime(status.lastTest.testedAt)}`
              : `Test falló: ${status.lastTest.error ?? "sin detalle"}`}
          </span>
        )}
      </div>
      <SyncStatus
        source={label}
        syncedAt={
          status.lastSync?.status === "success"
            ? status.lastSync.finishedAt
            : null
        }
        error={status.lastSync?.status === "error" ? "último sync falló" : null}
      />
    </div>
  );
}
