import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import type { SyncSource } from "@/modules/finance/domain/types";
import { SyncStatus } from "@/shared/ui/sync-status";

/** Panel del home 360 con enlace al módulo. */
export function HomePanel({
  title,
  href,
  children,
}: {
  title: string;
  href: Route;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver módulo <ArrowRight className="size-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

const SOURCE_LABELS: Record<SyncSource, string> = {
  alegra: "Alegra",
  clickup: "ClickUp",
  windsor: "Windsor",
};

/** Estado de las tres fuentes externas — visible para cualquier rol. */
export async function HomeSyncPanel() {
  const result = await getSyncStatus();
  const sync = result.ok ? result.data : null;

  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-card p-4">
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
    </section>
  );
}
