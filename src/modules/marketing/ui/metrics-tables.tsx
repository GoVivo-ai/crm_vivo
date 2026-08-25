import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdPlatform,
  CampaignMetrics,
  MetricRates,
  PlatformMetrics,
} from "@/modules/marketing/domain/types";
import { formatCurrency } from "@/shared/ui/format";

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  meta: "Meta",
  google_ads: "Google Ads",
};

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

function RateCells({ m }: { m: MetricRates }) {
  return (
    <>
      <TableCell className="text-right font-mono text-xs">
        {formatCurrency(m.spend, m.currency)}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {num.format(m.leads)}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {m.costPerLead !== null ? formatCurrency(m.costPerLead, m.currency) : "—"}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {num.format(m.clicks)}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {m.ctr !== null ? pct(m.ctr) : "—"}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {m.cpc !== null ? formatCurrency(m.cpc, m.currency) : "—"}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {m.roas !== null ? `${m.roas.toFixed(2)}×` : "—"}
      </TableCell>
    </>
  );
}

function MetricsHead() {
  return (
    <TableRow>
      <TableHead>Origen</TableHead>
      <TableHead className="text-right">Spend</TableHead>
      <TableHead className="text-right">Leads</TableHead>
      <TableHead className="text-right">Costo/lead</TableHead>
      <TableHead className="text-right">Clicks</TableHead>
      <TableHead className="text-right">CTR</TableHead>
      <TableHead className="text-right">CPC</TableHead>
      <TableHead className="text-right">ROAS</TableHead>
    </TableRow>
  );
}

export function PlatformTable({ rows }: { rows: PlatformMetrics[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <MetricsHead />
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={`${m.platform}-${m.currency}`}>
              <TableCell className="font-medium">
                {PLATFORM_LABELS[m.platform]}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {m.currency}
                </span>
              </TableCell>
              <RateCells m={m} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CampaignTable({
  rows,
  limit = 25,
}: {
  rows: CampaignMetrics[];
  limit?: number;
}) {
  const visible = rows.slice(0, limit);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <MetricsHead />
        </TableHeader>
        <TableBody>
          {visible.map((m) => (
            <TableRow key={`${m.platform}-${m.campaignExternalId}`}>
              <TableCell className="max-w-72">
                <p className="truncate text-sm font-medium">
                  {m.campaignName ?? m.campaignExternalId}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {PLATFORM_LABELS[m.platform]}
                  {m.adAccountName ? ` · ${m.adAccountName}` : ""}
                </p>
              </TableCell>
              <RateCells m={m} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > limit && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Mostrando las {limit} campañas con más spend de {rows.length}.
        </p>
      )}
    </div>
  );
}
