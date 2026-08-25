"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthlySpend } from "@/modules/purchases/domain/types";
import { formatCompactMoney, formatMoney } from "@/shared/ui/format";

const config = {
  totalCop: { label: "Gasto", color: "var(--module-finance)" },
} satisfies ChartConfig;

const MONTHS = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");

function monthLabel(month: string): string {
  const m = Number(month.slice(5, 7));
  return `${MONTHS[m - 1] ?? month} ${month.slice(2, 4)}`;
}

/** Gasto mensual (facturas de proveedor), últimos 12 meses. */
export function SpendChart({ spend }: { spend: MonthlySpend[] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={spend} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.35} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          tickFormatter={(v: number) => formatCompactMoney(v)}
          tickLine={false}
          axisLine={false}
          width={70}
          fontSize={11}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => monthLabel(String(label))}
              formatter={(value, _name, item) => {
                const bills = (item?.payload as MonthlySpend | undefined)
                  ?.bills;
                return `${formatMoney(Number(value))}${
                  bills !== undefined ? ` · ${bills} facturas` : ""
                }`;
              }}
            />
          }
        />
        <Bar
          dataKey="totalCop"
          fill="var(--color-totalCop)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  );
}
