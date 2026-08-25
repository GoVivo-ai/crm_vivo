import { cn } from "@/lib/utils";
import { formatRelativeTime, isFreshSync } from "@/shared/ui/format";

type SyncStatusProps = {
  /** Nombre de la fuente externa, p.ej. "Alegra", "Windsor", "ClickUp". */
  source: string;
  /** Fin del último sync exitoso; null = nunca sincronizado. */
  syncedAt: Date | null;
  /** Minutos tras los cuales el dato deja de considerarse fresco. */
  freshForMinutes?: number;
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
  className,
}: SyncStatusProps) {
  const isFresh = syncedAt !== null && isFreshSync(syncedAt, freshForMinutes);

  const label =
    syncedAt === null
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
          syncedAt === null && "bg-muted-foreground/40",
          syncedAt !== null && isFresh && "bg-health-ok sync-pulse-fresh",
          syncedAt !== null && !isFresh && "bg-health-warn",
        )}
      />
      {label}
    </span>
  );
}
