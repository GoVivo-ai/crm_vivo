import { cn } from "@/lib/utils";
import { getClientsSummary } from "@/modules/clients/application/clients-summary-action";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import {
  getCashflowSeries,
  getFinanceDashboard,
} from "@/modules/finance/application/finance-actions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can, readableResources } from "@/modules/identity/domain/permissions";
import { getMarketingDashboard } from "@/modules/marketing/application/marketing-actions";
import { listAllLeaveRequests } from "@/modules/people/application/leave-actions";
import {
  getPayrollCostSeries,
  getTeamDirectory,
} from "@/modules/people/application/team-actions";
import { getTreasuryPosition } from "@/modules/treasury/application/treasury-actions";
import { ClientesFranja } from "@/shared/ui/home/clientes-franja";
import { ComercialFranja } from "@/shared/ui/home/comercial-franja";
import { EquipoFranja } from "@/shared/ui/home/equipo-franja";
import { MarketingFranja } from "@/shared/ui/home/marketing-franja";
import { MoneyFranja } from "@/shared/ui/home/money-franja";
import { computeVerdict } from "@/shared/ui/home/verdict";
import { StaggerIn } from "@/shared/ui/stagger";

const TONE: Record<string, string> = {
  ok: "text-health-ok",
  warn: "text-health-warn",
  critical: "text-health-critical",
};

export default async function DashboardHome() {
  const user = await getCurrentUser();
  const allowed = user ? readableResources(user.role) : [];
  const has = (r: (typeof allowed)[number]) => allowed.includes(r);
  const isApprover =
    user !== null && can(user.role, "people_directory", "write");
  const seesPayroll =
    user !== null && can(user.role, "people_compensation", "read");

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const [finance, cashflow, treasury, board, clients, marketing, team, payroll, leave] =
    await Promise.all([
      has("finance") ? getFinanceDashboard() : null,
      has("finance") ? getCashflowSeries(12) : null,
      has("treasury") ? getTreasuryPosition() : null,
      has("crm") ? getPipelineBoard() : null,
      has("clients") ? getClientsSummary() : null,
      has("marketing") ? getMarketingDashboard({}) : null,
      has("people_directory") ? getTeamDirectory() : null,
      seesPayroll ? getPayrollCostSeries() : null,
      isApprover ? listAllLeaveRequests() : null,
    ]);

  const financeData = finance?.ok ? finance.data : null;
  const treasuryData = treasury?.ok ? treasury.data : null;
  const members = team?.ok ? team.data : [];
  const pendingLeave = leave?.ok
    ? leave.data.filter((r) => r.status === "requested").length
    : null;
  const expiringContracts = members.filter(
    (m) =>
      m.active &&
      m.contractEndDate !== null &&
      (Date.parse(m.contractEndDate) - Date.parse(today)) / 86_400_000 <= 60,
  ).length;
  const payrollThisMonth =
    payroll?.ok === true
      ? (payroll.data.points.find((p) => p.month === currentMonth)?.totalCop ??
        0)
      : null;

  const overdueCop =
    financeData?.receivables.aging
      .filter((b) => b.bucket !== "current")
      .reduce((s, b) => s + b.amountCop, 0) ?? 0;
  const burn = financeData?.pnlCurrentMonth
    ? financeData.pnlCurrentMonth.expensesCop +
      financeData.pnlCurrentMonth.payrollCop
    : 0;
  const verdict = computeVerdict({
    cashCop: treasuryData?.totalCashCop ?? null,
    coverageMonths:
      treasuryData && burn > 0 ? treasuryData.totalCashCop / burn : null,
    netIncomeCop: financeData?.pnlCurrentMonth?.netIncomeCop ?? null,
    overdueCop,
    riskyProjects: clients?.ok ? clients.data.projectsByHealth.red : 0,
    pendingLeave: pendingLeave ?? 0,
    expiringContracts,
  });

  const dateLine = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4 px-0.5">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {dateLine[0].toUpperCase() + dateLine.slice(1)} — la empresa está{" "}
            <span className={cn(TONE[verdict.tone])}>{verdict.word}</span>.
          </h1>
          <p className="mt-1.5 text-[13px] font-semibold text-muted-foreground">
            {verdict.phrase}
          </p>
        </div>
      </div>

      <StaggerIn>
        {financeData && (
          <MoneyFranja
            finance={financeData}
            treasury={treasuryData}
            cashflowSeries={cashflow?.ok ? cashflow.data : []}
          />
        )}
        <div className="grid items-start gap-5 lg:grid-cols-5">
          {board?.ok && (
            <div className="lg:col-span-3">
              <ComercialFranja
                board={board.data}
                mrrByCurrency={clients?.ok ? clients.data.mrrByCurrency : null}
                today={today}
                currentMonth={currentMonth}
              />
            </div>
          )}
          {clients?.ok && (
            <div className={cn(board?.ok ? "lg:col-span-2" : "lg:col-span-5")}>
              <ClientesFranja summary={clients.data} />
            </div>
          )}
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-5">
          {team?.ok && (
            <div className="lg:col-span-3">
              <EquipoFranja
                members={members}
                payrollThisMonthCop={payrollThisMonth}
                pendingLeaveCount={pendingLeave}
                today={today}
              />
            </div>
          )}
          {marketing?.ok && (
            <div className={cn(team?.ok ? "lg:col-span-2" : "lg:col-span-5")}>
              <MarketingFranja dashboard={marketing.data} />
            </div>
          )}
        </div>
      </StaggerIn>
    </div>
  );
}
