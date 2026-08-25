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
import type { PnlPoint } from "@/modules/finance/domain/types";
import {
  formatAccountingMoney,
  formatCompactMoney,
} from "@/shared/ui/format";

const config = {
  netIncomeCop: { label: "Resultado neto", color: "var(--health-ok)" },
} satisfies ChartConfig;

// Par de polaridad VIVO validado con dataviz (ALL PASS); el signo también
// se codifica por posición respecto a la línea de cero.
const POSITIVE = "#069b66";
const NEGATIVE = "#b3261e";

const MONTHS = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
const monthLabel = (m: string) =>
  `${MONTHS[Number(m.slice(5, 7)) - 1] ?? m} ${m.slice(2, 4)}`;

/**
 * Resultado neto mensual (ingresos − gastos − nómina, desde registros
 * propios). Dominio sin recorte en cero: hay meses con pérdida real.
 */
export function PnlChart({ series }: { series: PnlPoint[] }) {
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
              formatter={(value) => formatAccountingMoney(Number(value))}
            />
          }
        />
        <Bar dataKey="netIncomeCop" radius={[4, 4, 0, 0]} maxBarSize={26}>
          {series.map((p) => (
            <Cell
              key={p.month}
              fill={p.netIncomeCop < 0 ? NEGATIVE : POSITIVE}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
