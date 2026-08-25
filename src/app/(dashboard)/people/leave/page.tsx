import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import {
  getMyLeave,
  listAllLeaveRequests,
} from "@/modules/people/application/leave-actions";
import { LEAVE_DAY_UNIT } from "@/modules/people/domain/leave-days";
import { ApprovalsList, MyLeaveList } from "@/modules/people/ui/leave-lists";
import { LeaveRequestForm } from "@/modules/people/ui/leave-request-form";
import { EmptyState } from "@/shared/ui/empty-state";
import { Kpi } from "@/shared/ui/kpi";

export default async function LeavePage() {
  const user = await getCurrentUser();
  const isApprover =
    user !== null && can(user.role, "people_directory", "write");

  const [mine, all] = await Promise.all([
    getMyLeave(),
    isApprover ? listAllLeaveRequests() : null,
  ]);

  const pendingApprovals = all?.ok
    ? all.data.filter((r) => r.status === "requested")
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ausencias</h1>
        {mine.ok && <LeaveRequestForm />}
      </div>

      {!mine.ok ? (
        <EmptyState title="Sin expediente vinculado" hint={mine.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi
              label="Días al año"
              value={mine.data.balance.annualLeaveDays}
              kind="count"
              detail={LEAVE_DAY_UNIT}
            />
            <Kpi
              label="Aprobados este año"
              value={mine.data.balance.approvedDaysThisYear}
              kind="count"
              detail={LEAVE_DAY_UNIT}
            />
            <Kpi
              label="Disponibles"
              value={mine.data.balance.remainingDays}
              kind="count"
              size="lg"
              detail={LEAVE_DAY_UNIT}
            />
          </div>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Mis solicitudes</h2>
            {mine.data.requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin solicitudes todavía. Pide tu primera ausencia arriba.
              </p>
            ) : (
              <MyLeaveList requests={mine.data.requests} unit={LEAVE_DAY_UNIT} />
            )}
          </section>
        </>
      )}

      {isApprover && all !== null && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            Por aprobar
            {pendingApprovals.length > 0 && (
              <span className="ml-1.5 rounded-full bg-health-warn/15 px-2 text-xs font-semibold text-health-warn">
                {pendingApprovals.length}
              </span>
            )}
          </h2>
          {!all.ok ? (
            <p className="text-sm text-muted-foreground">{all.error}</p>
          ) : pendingApprovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nada pendiente de decisión.
            </p>
          ) : (
            <ApprovalsList
              requests={pendingApprovals}
              currentUserId={user?.id ?? ""}
              unit={LEAVE_DAY_UNIT}
            />
          )}
        </section>
      )}
    </div>
  );
}
