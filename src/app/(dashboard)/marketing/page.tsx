import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import { getMarketingDashboard } from "@/modules/marketing/application/marketing-actions";
import type { MetricTotals } from "@/modules/marketing/domain/types";
import { DashboardFilters } from "@/modules/marketing/ui/dashboard-filters";
import { MetricTile } from "@/modules/marketing/ui/metric-tile";
import {
  CampaignTable,
  PlatformTable,
} from "@/modules/marketing/ui/metrics-tables";
import { ActionError } from "@/shared/ui/action-error";
import { formatCurrency } from "@/shared/ui/format";
import { SyncStatus } from "@/shared/ui/sync-status";

const pct = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

/** Spend multi-moneda en líneas; sin convertir a COP (no hay TRM diaria). */
function SpendValue({ totals }: { totals: MetricTotals }) {
  const entries = Object.entries(totals.spendByCurrency);
  if (entries.length === 0) return <>—</>;
  return (
    <>
      {entries.map(([currency, amount]) => (
        <p key={currency}>{formatCurrency(amount, currency)}</p>
      ))}
    </>
  );
}

export default async function MarketingPage({
  searchParams,
}: PageProps<"/marketing">) {
  const params = await searchParams;
  const accountId =
    typeof params.account === "string" && params.account !== ""
      ? params.account
      : null;
  const from = typeof params.from === "string" && params.from ? params.from : null;
  const to = typeof params.to === "string" && params.to ? params.to : null;

  const [dashboard, accountsResult, syncStatus] = await Promise.all([
    getMarketingDashboard({
      ...(accountId ? { accountId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    listAccounts(),
    getSyncStatus(),
  ]);
  if (!dashboard.ok) return <ActionError message={dashboard.error} />;

  const { period, totals, previousTotals, byPlatform, byCampaign } =
    dashboard.data;
  const clients = accountsResult.ok
    ? accountsResult.data.map(({ id, name }) => ({ id, name }))
    : [];
  const metaAds = syncStatus.ok ? syncStatus.data.meta_ads : null;

  // Costo por lead solo es agregable con una única moneda de spend.
  const currencies = Object.keys(totals.spendByCurrency);
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const cpl =
    singleCurrency && totals.leads > 0
      ? totals.spendByCurrency[singleCurrency] / totals.leads
      : null;
  const prevCpl =
    singleCurrency &&
    previousTotals.leads > 0 &&
    previousTotals.spendByCurrency[singleCurrency] !== undefined
      ? previousTotals.spendByCurrency[singleCurrency] / previousTotals.leads
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mt-1 text-xs text-muted-foreground">
            {period.from} → {period.to}
          </p>
        </div>
        <SyncStatus
          source="Meta Ads"
          syncedAt={metaAds?.status === "success" ? metaAds.finishedAt : null}
          error={metaAds?.status === "error" ? metaAds.error : null}
        />
      </div>

      <DashboardFilters
        clients={clients}
        accountId={accountId}
        from={from}
        to={to}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Leads"
          value={totals.leads}
          deltaPct={pct(totals.leads, previousTotals.leads)}
          goodWhen="up"
          emphasis
        />
        <MetricTile
          label="Costo por lead"
          value={
            cpl !== null && singleCurrency
              ? formatCurrency(cpl, singleCurrency)
              : "—"
          }
          deltaPct={cpl !== null && prevCpl !== null ? pct(cpl, prevCpl) : null}
          goodWhen="down"
        />
        <MetricTile
          label="Spend"
          value={<SpendValue totals={totals} />}
          deltaPct={null}
          goodWhen="down"
        />
        <MetricTile
          label="Clicks"
          value={totals.clicks}
          deltaPct={pct(totals.clicks, previousTotals.clicks)}
          goodWhen="up"
        />
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Por plataforma</h2>
        {byPlatform.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin métricas en el periodo — revisa el sync de Meta Ads o el rango.
          </p>
        ) : (
          <PlatformTable rows={byPlatform} />
        )}
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Campañas</h2>
        {byCampaign.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin campañas en el periodo.
          </p>
        ) : (
          <CampaignTable rows={byCampaign} />
        )}
      </section>
    </div>
  );
}
