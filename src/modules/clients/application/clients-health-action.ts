"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { listAccountsWorstHealth } from "@/modules/clients/infrastructure/clients-summary-repository";
import { getPaymentsByEmployeeMonth } from "@/modules/people/infrastructure/payroll-repository";
import {
  getRevenueByAccount,
} from "@/modules/profitability/infrastructure/profitability-repository";
import { listStaffingOverlappingPeriod } from "@/modules/profitability/infrastructure/staffing-repository";

export type ClientHealthChip = {
  accountId: string;
  accountName: string;
  bucket: "green" | "yellow" | "red";
  /** Margen COP de los últimos 3 meses, si hay datos de rentabilidad. */
  marginCop?: number;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Semáforo de clientes para el Home 360 (clients:read).
 * REGLA DE BUCKET (documentada para la UI):
 * 1. Base = peor salud de los proyectos de la cuenta (red > yellow >
 *    green); sin proyectos o solo unknown → green.
 * 2. Si hay datos de rentabilidad (últimos 3 meses, mismo método que F9)
 *    y el margen es NEGATIVO, el bucket se eleva un nivel (green→yellow,
 *    yellow→red); si además el costo asignado duplica los ingresos (o hay
 *    costo sin ingreso alguno), fuerza red.
 */
export async function getClientsHealthList(): Promise<
  ActionResult<ClientHealthChip[]>
> {
  return runAction("clients", "read", async () => {
    const now = new Date();
    const period = {
      from: isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))),
      to: isoDate(now),
    };
    const [healthRows, revenue, staffing, payments] = await Promise.all([
      listAccountsWorstHealth(),
      getRevenueByAccount(period),
      listStaffingOverlappingPeriod(period),
      getPaymentsByEmployeeMonth(period),
    ]);

    const costByAccount = new Map<string, number>();
    for (const payment of payments) {
      for (const s of staffing) {
        if (s.employeeId !== payment.employeeId) continue;
        costByAccount.set(
          s.accountId,
          (costByAccount.get(s.accountId) ?? 0) +
            (payment.amountCop * s.dedicationPercent) / 100,
        );
      }
    }

    const escalate = (b: "green" | "yellow" | "red") =>
      b === "green" ? "yellow" : "red";

    return healthRows.map((row) => {
      let bucket: "green" | "yellow" | "red" =
        row.worstHealth === "red"
          ? "red"
          : row.worstHealth === "yellow"
            ? "yellow"
            : "green";
      const cost = costByAccount.get(row.accountId);
      const rev = revenue.find((r) => r.accountId === row.accountId);
      let marginCop: number | undefined;
      if (cost !== undefined || rev !== undefined) {
        const revenueCop = rev?.revenueCop ?? 0;
        marginCop = Math.round(revenueCop - (cost ?? 0));
        if (marginCop < 0) {
          bucket = escalate(bucket);
          if ((cost ?? 0) >= revenueCop * 2) bucket = "red";
        }
      }
      return { accountId: row.accountId, accountName: row.accountName, bucket, marginCop };
    });
  });
}
