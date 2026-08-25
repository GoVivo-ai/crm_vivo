"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CashflowPoint } from "@/modules/finance/domain/types";
import { ChartEmpty } from "@/shared/ui/chart-empty";
import {
  formatAccountingMoney,
  formatCompactMoney,
} from "@/shared/ui/format";

const config = {
  netCop: { label: "Flujo neto", color: "var(--chart-2)" },
} satisfies ChartConfig;

const POSITIVE = "#1e5fbf";
const NEGATIVE = "#b3261e";

const MONTHS = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
const monthLabel = (m: string) =>
  `${MONTHS[Number(m.slice(5, 7)) - 1] ?? m} ${m.slice(2, 4)}`;

/**
 * Flujo de caja neto mensual desde movimientos bancarios registrados.
 * Dominio sin recorte en cero; el tooltip desglosa entradas y salidas.
 */
export function CashflowChart({ series }: { series: CashflowPoint[] }) {
  if (series.every((p) => p.inflowCop === 0 && p.outflowCop === 0)) {
    return (
      <ChartEmpty
        text="Aún sin flujo de caja."
        hint="Registra movimientos de tesorería para ver el flujo neto."
      />
    );
  }
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={series} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.35} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => formatCompactMoney(v)}
          tickLine={false}
          axisLine={false}
          width={78}
          fontSize={11}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeWidth={1} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => monthLabel(String(label))}
              formatter={(value, _name, item) => {
                const p = item?.payload as CashflowPoint | undefined;
                const detail = p
                  ? ` (entra ${formatCompactMoney(p.inflowCop)} · sale ${formatCompactMoney(p.outflowCop)})`
                  : "";
                return `${formatAccountingMoney(Number(value))}${detail}`;
              }}
            />
          }
        />
        <Bar dataKey="netCop" radius={[4, 4, 0, 0]} maxBarSize={26}>
          {series.map((p) => (
            <Cell key={p.month} fill={p.netCop < 0 ? NEGATIVE : POSITIVE} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
