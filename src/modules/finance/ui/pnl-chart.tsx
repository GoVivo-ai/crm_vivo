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
import type { PnlSeriesPoint } from "@/modules/finance/domain/types";
import {
  formatAccountingMoney,
  formatCompactMoney,
} from "@/shared/ui/format";

const config = {
  netIncome: { label: "Resultado neto", color: "var(--health-ok)" },
} satisfies ChartConfig;

// Par de polaridad de la paleta VIVO, validado con el script del skill
// dataviz (ALL PASS; el signo además se codifica por posición respecto a
// la línea de cero + tooltip contable).
const POSITIVE = "#069b66";
const NEGATIVE = "#b3261e";

function dayLabel(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/**
 * Resultado neto por snapshot. Dominio sin recorte en cero: hay pérdidas
 * reales y las barras negativas cuelgan bajo la línea de cero.
 */
export function PnlChart({ series }: { series: PnlSeriesPoint[] }) {
  const data = series.map((p) => ({
    date: p.date,
    netIncome: p.totals.netIncome,
  }));

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.35} />
        <XAxis
          dataKey="date"
          tickFormatter={dayLabel}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          minTickGap={24}
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
              labelFormatter={(label) => dayLabel(String(label))}
              formatter={(value) => formatAccountingMoney(Number(value))}
            />
          }
        />
        <Bar dataKey="netIncome" radius={[4, 4, 0, 0]} maxBarSize={22}>
          {data.map((d) => (
            <Cell
              key={d.date}
              fill={d.netIncome < 0 ? NEGATIVE : POSITIVE}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
