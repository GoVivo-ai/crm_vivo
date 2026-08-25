"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AgingBucket } from "@/modules/finance/domain/types";
import { formatCompactMoney, formatMoney } from "@/shared/ui/format";

const config = {
  amountCop: { label: "Cartera", color: "var(--module-finance)" },
} satisfies ChartConfig;

const BUCKET_LABELS: Record<string, string> = {
  current: "Al día",
  "1-30": "1–30 d",
  "31-60": "31–60 d",
  "61-90": "61–90 d",
  "90+": "+90 d",
};

/**
 * Aging de cartera en 5 buckets fijos. La magnitud la da la altura
 * (una sola tinta); la antigüedad la da el eje, no el color.
 */
export function AgingChart({ aging }: { aging: AgingBucket[] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={aging} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.35} />
        <XAxis
          dataKey="bucket"
          tickFormatter={(b: string) => BUCKET_LABELS[b] ?? b}
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
              labelFormatter={(label) => BUCKET_LABELS[String(label)] ?? label}
              formatter={(value, _name, item) => {
                const invoices = (item?.payload as AgingBucket | undefined)
                  ?.invoices;
                return `${formatMoney(Number(value))}${
                  invoices !== undefined ? ` · ${invoices} facturas` : ""
                }`;
              }}
            />
          }
        />
        <Bar
          dataKey="amountCop"
          fill="var(--color-amountCop)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  );
}
