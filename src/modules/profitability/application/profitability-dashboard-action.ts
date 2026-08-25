"use server";

import type { ActionResult } from "@/shared/actions/result";
import { runAction } from "@/modules/identity/application/run-action";
import { parseInput } from "@/modules/crm/application/action-helpers";
import type {
  AccountProfitability,
  ProfitabilityDashboard,
} from "@/modules/profitability/domain/types";
import { profitabilityPeriodSchema } from "@/modules/profitability/domain/validation";
import { getPaymentsByEmployeeMonth } from "@/modules/people/infrastructure/payroll-repository";
import {
  countActiveEmployees,
  getAdSpendByAccount,
  getRevenueByAccount,
  getUnassignedRevenue,
} from "@/modules/profitability/infrastructure/profitability-repository";
import { listStaffingOverlappingPeriod } from "@/modules/profitability/infrastructure/staffing-repository";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

type StaffingRow = Awaited<
  ReturnType<typeof listStaffingOverlappingPeriod>
>[number];

/** Vigente en el mes = su rango solapa [mes-01, mes-fin]. */
function activeInMonth(row: StaffingRow, month: string): boolean {
  return (
    (row.validFrom ?? "0000-01-01") <= `${month}-31` &&
    `${month}-01` <= (row.validTo ?? "9999-12-31")
  );
}

/**
 * Margen por cuenta (profitability:read = finance/management/admin).
 * Costo de personal REAL por empleado (pagos de nómina registrados):
 * costo(cuenta, mes) = Σ pago(empleado, mes) × %dedicación/100.
 * El residuo (pagos sin asignación) queda como unassignedCostCop.
 * adSpend es informativo, NO se resta del margen.
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
    const [
      revenue,
      adSpend,
      staffing,
      payments,
      activeEmployees,
      revenueUnassignedCop,
    ] = await Promise.all([
      getRevenueByAccount(period),
      getAdSpendByAccount(period),
      listStaffingOverlappingPeriod(period),
      getPaymentsByEmployeeMonth(period),
      countActiveEmployees(),
      getUnassignedRevenue(period),
    ]);

    const staffingCostByAccount = new Map<string, number>();
    let totalPayrollCop = 0;
    for (const payment of payments) {
      totalPayrollCop += payment.amountCop;
      const assignments = staffing.filter(
        (s) =>
          s.employeeId === payment.employeeId &&
          activeInMonth(s, payment.month),
      );
      for (const s of assignments) {
        staffingCostByAccount.set(
          s.accountId,
          (staffingCostByAccount.get(s.accountId) ?? 0) +
            (payment.amountCop * s.dedicationPercent) / 100,
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
            .filter((s) => s.accountId === accountId)
            .reduce((acc, s) => acc + s.dedicationPercent, 0),
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
      revenueUnassignedCop: Math.round(revenueUnassignedCop),
      activeEmployees,
      assumption: "per-employee-cost" as const,
      accounts,
    };
  });
}
