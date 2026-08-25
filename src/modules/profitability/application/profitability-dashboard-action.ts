"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  AccountProfitability,
  ProfitabilityDashboard,
} from "@/modules/profitability/domain/types";
import { profitabilityPeriodSchema } from "@/modules/profitability/domain/validation";
import { getPayrollCostForRange } from "@/modules/people/infrastructure/payroll-cost-repository";
import {
  countActiveEmployees,
  getAdSpendByAccount,
  getRevenueByAccount,
} from "@/modules/profitability/infrastructure/profitability-repository";
import { listStaffingOverlappingPeriod } from "@/modules/profitability/infrastructure/staffing-repository";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Meses YYYY-MM cubiertos por el rango. */
function monthsInRange(from: string, to: string): string[] {
  const months: string[] = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = to.slice(0, 7);
  while (isoDate(cursor).slice(0, 7) <= end) {
    months.push(isoDate(cursor).slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

type StaffingRow = Awaited<
  ReturnType<typeof listStaffingOverlappingPeriod>
>[number];

/** Vigente en el mes = su rango solapa [mes-01, mes-fin]. */
function activeInMonth(row: StaffingRow, month: string): boolean {
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  return (
    (row.validFrom ?? "0000-01-01") <= monthEnd &&
    monthStart <= (row.validTo ?? "9999-12-31")
  );
}

/**
 * Margen por cuenta (profitability:read = finance/management/admin).
 * Prorrateo mensual por CAPACIDAD TOTAL (directriz del Planeador):
 * costo(cuenta, mes) = nómina(mes) × Σ%(cuenta, mes) / (100 × empleados
 * activos); el residuo queda como unassignedCostCop (compañía). Supone
 * costo igual por empleado — assumption: 'equal-cost' en el resultado.
 * adSpend es informativo, NO se resta del margen (el cliente paga su
 * pauta directo — pendiente confirmación final con datos).
 */
export async function getProfitabilityDashboard(
  input: unknown = {},
): Promise<ActionResult<ProfitabilityDashboard>> {
  const parsed = parseInput(profitabilityPeriodSchema, input);
  if (!parsed.ok) return parsed.result;
  const now = new Date();
  const to = parsed.data.to ?? isoDate(now);
  const from =
    parsed.data.from ??
    isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)));
  const period = { from, to };

  return runAction("profitability", "read", async () => {
    const [revenue, adSpend, staffing, payrollSeries, activeEmployees] =
      await Promise.all([
        getRevenueByAccount(period),
        getAdSpendByAccount(period),
        listStaffingOverlappingPeriod(period),
        getPayrollCostForRange(period),
        countActiveEmployees(),
      ]);

    const months = monthsInRange(from, to);
    const staffingCostByAccount = new Map<string, number>();
    let totalPayrollCop = 0;
    // Capacidad total del mes: 100% × empleados activos (conteo actual;
    // no hay historial mensual del directorio).
    const capacityPercent = 100 * Math.max(activeEmployees, 1);
    for (const month of months) {
      const payroll = payrollSeries.find((p) => p.month === month);
      if (!payroll || payroll.totalCop === 0) continue;
      totalPayrollCop += payroll.totalCop;
      const active = staffing.filter((s) => activeInMonth(s, month));
      for (const s of active) {
        staffingCostByAccount.set(
          s.accountId,
          (staffingCostByAccount.get(s.accountId) ?? 0) +
            (payroll.totalCop * s.dedicationPercent) / capacityPercent,
        );
      }
    }

    const totalAssignedPercent = staffing.reduce(
      (acc, s) => acc + s.dedicationPercent,
      0,
    );
    const adSpendMap = new Map<string, number>(
      adSpend.map((a) => [a.accountId, a.adSpendCop] as [string, number]),
    );
    const accountIds = new Set<string>([
      ...revenue.map((r) => r.accountId),
      ...staffingCostByAccount.keys(),
    ]);

    const accounts: AccountProfitability[] = [...accountIds]
      .map((accountId) => {
        const rev = revenue.find((r) => r.accountId === accountId);
        const revenueCop = rev?.revenueCop ?? 0;
        const staffingCostCop = Math.round(
          staffingCostByAccount.get(accountId) ?? 0,
        );
        const marginCop = revenueCop - staffingCostCop;
        return {
          accountId,
          accountName: rev?.accountName ?? "(sin facturación)",
          revenueCop,
          staffingCostCop,
          assignedDedicationPercent: staffing
            .filter((s: StaffingRow) => s.accountId === accountId)
            .reduce(
              (acc: number, s: StaffingRow) => acc + s.dedicationPercent,
              0,
            ),
          adSpendCop: adSpendMap.get(accountId) ?? 0,
          adSpendIncludedInMargin: false as const,
          marginCop,
          marginPercent:
            revenueCop > 0 ? (marginCop / revenueCop) * 100 : null,
        };
      })
      .sort((a, b) => b.marginCop - a.marginCop);

    const assignedTotal = [...staffingCostByAccount.values()].reduce(
      (acc, v) => acc + v,
      0,
    );

    return {
      period,
      totalPayrollCop,
      totalAssignedPercent,
      unassignedCostCop: Math.round(totalPayrollCop - assignedTotal),
      activeEmployees,
      assumption: "equal-cost" as const,
      costScope: "colombia-only" as const,
      accounts,
    };
  });
}
