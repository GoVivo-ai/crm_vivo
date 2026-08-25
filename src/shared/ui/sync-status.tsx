import { cn } from "@/lib/utils";
import { formatRelativeTime, isFreshSync } from "@/shared/ui/format";

type SyncStatusProps = {
  /** Nombre de la fuente externa, p.ej. "Alegra", "Meta Ads", "ClickUp". */
  source: string;
  /** Fin del último sync exitoso; null = nunca sincronizado. */
  syncedAt: Date | null;
  /** Minutos tras los cuales el dato deja de considerarse fresco. */
  freshForMinutes?: number;
  /** Mensaje si el último sync falló — pinta el punto en rojo. */
  error?: string | null;
  className?: string;
};

/**
 * El pulso de sincronización — firma de la UI. Toda vista que lea de una
 * tabla cache declara aquí, honestamente, qué tan vivo está su dato:
 * verde latiendo = fresco, ámbar fijo = viejo, gris = nunca sincronizado.
 */
export function SyncStatus({
  source,
  syncedAt,
  freshForMinutes = 360,
  error = null,
  className,
}: SyncStatusProps) {
  const isFresh = syncedAt !== null && isFreshSync(syncedAt, freshForMinutes);

  const label = error
    ? `${source} · error de sincronización`
    : syncedAt === null
      ? `${source} · sin sincronizar`
      : `${source} · sincronizado ${formatRelativeTime(syncedAt)}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          error
            ? "bg-health-critical"
            : syncedAt === null
              ? "bg-muted-foreground/40"
              : isFresh
                ? "bg-health-ok sync-pulse-fresh"
                : "bg-health-warn",
        )}
      />
      <span title={error ?? undefined}>{label}</span>
    </span>
  );
}
