import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import type { SyncSource } from "@/modules/finance/domain/types";
import { KpiMultiCurrency } from "@/shared/ui/kpi";
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

/** KPI del home con montos desglosados por moneda (jamás se mezclan). */
export function MoneyTile({
  label,
  amounts,
  detail,
  round = false,
}: {
  label: string;
  amounts: Record<string, number>;
  detail?: string;
  round?: boolean;
}) {
  const rounded = round
    ? Object.fromEntries(
        Object.entries(amounts).map(([c, a]) => [c, Math.round(a)]),
      )
    : amounts;
  return <KpiMultiCurrency label={label} amounts={rounded} detail={detail} />;
}

const SOURCE_LABELS: Record<SyncSource, string> = {
  quickbooks: "QuickBooks",
  clickup: "ClickUp",
  meta_ads: "Meta Ads",
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
