import type { PipelineBoard } from "@/modules/crm/domain/types";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";
import { KpiMultiCurrency } from "@/shared/ui/kpi";
import { formatCompactMoney } from "@/shared/ui/format";

// Degradé de verdes del funnel — colores exactos del DESIGN-SPEC §10.
const FUNNEL_GREENS = ["#BFE9DA", "#7ED4B4", "#2FB183", "#069B66"];

type ComercialFranjaProps = {
  board: PipelineBoard;
  mrrByCurrency: Record<string, number> | null;
  today: string;
  currentMonth: string; // YYYY-MM
};

/** Franja Comercial: pipeline + funnel horizontal segmentado + MRR. */
export function ComercialFranja({
  board,
  mrrByCurrency,
  today,
  currentMonth,
}: ComercialFranjaProps) {
  const open = board.stages.filter((s) => !s.isWon && !s.isLost);
  const stageTotals = open.map((s) => ({
    name: s.name,
    total: s.deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    count: s.deals.length,
  }));
  const pipelineTotal = stageTotals.reduce((s, x) => s + x.total, 0);
  const dealCount = stageTotals.reduce((s, x) => s + x.count, 0);

  const openDeals = open.flatMap((s) => s.deals);
  const nextClose = openDeals
    .filter((d) => d.expectedCloseDate && d.expectedCloseDate >= today)
    .sort((a, b) =>
      (a.expectedCloseDate ?? "").localeCompare(b.expectedCloseDate ?? ""),
    )[0];
  const wonThisMonth = board.stages
    .filter((s) => s.isWon)
    .flatMap((s) => s.deals)
    .filter((d) => d.closedAt?.toISOString().slice(0, 7) === currentMonth);
  const overdueDeals = openDeals.filter(
    (d) => d.expectedCloseDate && d.expectedCloseDate < today,
  ).length;

  const verdict: Veredicto =
    dealCount === 0 ? "atencion" : overdueDeals > 0 ? "atencion" : "bien";

  return (
    <Franja
      dot="var(--module-crm)"
      label="Comercial"
      verdict={verdict}
      href="/crm/pipeline"
      linkLabel="Abrir CRM"
    >
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Pipeline abierto
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
            {formatCompactMoney(pipelineTotal)}
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-muted-foreground">
            {dealCount} negocios
          </p>
        </div>
        {mrrByCurrency && (
          <KpiMultiCurrency
            label="MRR"
            amounts={mrrByCurrency}
            className="border-0 p-0 shadow-none hover:shadow-none"
          />
        )}
      </div>

      {pipelineTotal > 0 && (
        <div className="mt-4">
          <div className="flex h-7 gap-[3px] overflow-hidden rounded-lg">
            {stageTotals.map((stage, i) => (
              <div
                key={stage.name}
                title={`${stage.name}: ${formatCompactMoney(stage.total)}`}
                style={{
                  width: `${Math.max((stage.total / pipelineTotal) * 100, 4)}%`,
                  background:
                    FUNNEL_GREENS[
                      Math.min(
                        Math.floor(
                          (i / Math.max(stageTotals.length - 1, 1)) *
                            (FUNNEL_GREENS.length - 1),
                        ),
                        FUNNEL_GREENS.length - 1,
                      )
                    ],
                }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between gap-2 text-[10.5px] font-bold text-muted-foreground">
            {stageTotals.map((s) => (
              <span key={s.name} className="truncate">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11.5px] font-semibold text-muted-foreground">
        {nextClose
          ? `Próximo cierre: ${nextClose.title} · ${nextClose.expectedCloseDate}`
          : "Sin cierres programados"}
        {" · "}
        {wonThisMonth.length > 0
          ? `${wonThisMonth.length} ganado${wonThisMonth.length === 1 ? "" : "s"} este mes (${formatCompactMoney(wonThisMonth.reduce((s, d) => s + (d.amount ?? 0), 0))})`
          : "sin ganados este mes"}
      </p>
    </Franja>
  );
}
