import type { MarketingDashboard } from "@/modules/marketing/domain/types";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";
import { formatCurrency } from "@/shared/ui/format";

// Teales para las mini-barras (top campañas por spend).
const TEALS = ["#0790A8", "#2FA6BC", "#5FBCCE", "#8FD2DF", "#BFE7EE"];

/** Franja Marketing: pauta administrada + mini-barras + leads/CPL. */
export function MarketingFranja({
  dashboard,
}: {
  dashboard: MarketingDashboard;
}) {
  const { totals, previousTotals, byCampaign } = dashboard;
  const spendEntries = Object.entries(totals.spendByCurrency);
  const leadsDelta =
    previousTotals.leads > 0
      ? ((totals.leads - previousTotals.leads) / previousTotals.leads) * 100
      : null;

  const currencies = Object.keys(totals.spendByCurrency);
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const cpl =
    singleCurrency && totals.leads > 0
      ? totals.spendByCurrency[singleCurrency] / totals.leads
      : null;

  // Orden fijado por el diseñador: ascendente izq→der, teal más oscura
  // (#0790A8) para el mayor spend (el de la derecha).
  const top = byCampaign.slice(0, 5).sort((a, b) => a.spend - b.spend);
  const maxSpend = Math.max(...top.map((c) => c.spend), 1);

  const verdict: Veredicto =
    totals.leads === 0 && spendEntries.length > 0
      ? "atencion"
      : leadsDelta !== null && leadsDelta < -20
        ? "atencion"
        : "bien";

  return (
    <Franja
      dot="var(--module-marketing)"
      label="Marketing"
      verdict={verdict}
      href="/marketing"
      linkLabel="Abrir Marketing"
    >
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Pauta administrada · 30 d
          </p>
          <div className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
            {spendEntries.length === 0
              ? "—"
              : spendEntries.map(([currency, amount]) => (
                  <p key={currency}>{formatCurrency(amount, currency)}</p>
                ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Leads
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
            {totals.leads}
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-muted-foreground">
            {leadsDelta !== null &&
              `${leadsDelta > 0 ? "+" : ""}${leadsDelta.toFixed(0)}% vs periodo anterior`}
            {cpl !== null &&
              singleCurrency &&
              ` · CPL ${formatCurrency(cpl, singleCurrency)}`}
          </p>
        </div>
      </div>

      {top.length > 0 && (
        <div className="mt-3.5">
          <div className="flex h-6 items-end gap-1">
            {top.map((c, i) => (
              <div
                key={`${c.platform}-${c.campaignExternalId}`}
                title={`${c.campaignName ?? c.campaignExternalId}: ${formatCurrency(c.spend, c.currency)}`}
                className="w-8 rounded-t"
                style={{
                  height: `${Math.max((c.spend / maxSpend) * 100, 12)}%`,
                  background: TEALS[top.length - 1 - i] ?? TEALS.at(-1),
                }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[10.5px] font-bold text-muted-foreground">
            Top campañas por spend · mejor cuenta:{" "}
            {top.at(-1)?.adAccountName ?? top.at(-1)?.campaignName ?? "—"}
          </p>
        </div>
      )}
    </Franja>
  );
}
