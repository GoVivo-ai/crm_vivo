"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { CashflowSeriesPoint } from "@/modules/finance/domain/types";
import {
  formatAccountingMoney,
  formatCompactMoney,
} from "@/shared/ui/format";

const config = {
  finalBalance: { label: "Saldo en bancos", color: "#175e73" },
} satisfies ChartConfig;

function dayLabel(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/**
 * Saldo final en bancos por día. El dominio NUNCA se recorta en cero:
 * hay saldos negativos reales y la línea debe cruzar el cero visible.
 */
export function CashflowChart({ series }: { series: CashflowSeriesPoint[] }) {
  const data = series.map((p) => ({
    date: p.date,
    finalBalance: p.summary.finalBalance,
  }));

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
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
        <Line
          dataKey="finalBalance"
          type="monotone"
          stroke="var(--color-finalBalance)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
