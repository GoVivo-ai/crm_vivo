import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import { getTeamDirectory } from "@/modules/people/application/team-actions";
import { listAccountStaffing } from "@/modules/profitability/application/staffing-actions";
import { StaffingManager } from "@/modules/profitability/ui/staffing-manager";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function StaffingPage() {
  const user = await getCurrentUser();
  const canWrite = user !== null && can(user.role, "profitability", "write");

  const [staffing, accountsResult, directory] = await Promise.all([
    listAccountStaffing(),
    listAccounts(),
    getTeamDirectory(),
  ]);
  if (!staffing.ok) return <ActionError message={staffing.error} />;

  const accounts = accountsResult.ok
    ? accountsResult.data
        .filter((a) => a.status !== "prospect")
        .map(({ id, name }) => ({ id, name }))
    : [];
  const employees = directory.ok
    ? directory.data
        .filter((m) => m.active)
        .map((m) => ({ id: m.id, name: m.fullName }))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mt-1 text-sm text-muted-foreground">
          Quién trabaja para qué cliente y con qué % de dedicación — la base
          del costo de personal en Rentabilidad.
        </p>
      </div>

      {!canWrite && staffing.data.length === 0 ? (
        <EmptyState
          title="Sin asignaciones"
          hint="Un administrador debe crear las asignaciones empleado↔cliente."
        />
      ) : canWrite ? (
        <StaffingManager
          assignments={staffing.data}
          accounts={accounts}
          employees={employees}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {staffing.data.map((a) => (
            <li key={a.id} className="rounded-lg border px-3 py-2">
              <p className="text-sm font-medium">
                {a.employeeName ?? "—"} → {a.accountName ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.dedicationPercent}% de dedicación
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
