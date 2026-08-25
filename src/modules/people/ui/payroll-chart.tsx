"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PayrollCostPoint } from "@/modules/people/domain/types";
import { formatCompactMoney, formatMoney } from "@/shared/ui/format";

const config = {
  totalCop: { label: "Costo", color: "var(--module-finance)" },
} satisfies ChartConfig;

const MONTHS = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");

function monthLabel(month: string): string {
  const m = Number(month.slice(5, 7));
  return `${MONTHS[m - 1] ?? month} ${month.slice(2, 4)}`;
}

/**
 * Serie mensual del costo de nómina. La etiqueta de la serie viene del
 * contrato ("costo de nómina (desde pagos)") y es OBLIGATORIA en la UI:
 * el dato se deriva de pagos categorizados, no del módulo de nómina.
 */
export function PayrollChart({
  label,
  points,
}: {
  label: string;
  points: PayrollCostPoint[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <ChartContainer config={config} className="h-56 w-full">
        <BarChart data={points} margin={{ left: 8, right: 8 }}>
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
                labelFormatter={(l) => monthLabel(String(l))}
                formatter={(value, _name, item) => {
                  const payments = (
                    item?.payload as PayrollCostPoint | undefined
                  )?.payments;
                  return `${formatMoney(Number(value))}${
                    payments !== undefined ? ` · ${payments} pagos` : ""
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
      <p className="text-xs text-muted-foreground">Serie: {label}.</p>
    </div>
  );
}
