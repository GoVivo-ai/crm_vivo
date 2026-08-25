import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import {
  getPayrollCostSeries,
  getTeamDirectory,
  listRecentPayrollPayments,
} from "@/modules/people/application/team-actions";
import { PayrollPaymentForm } from "@/modules/people/ui/payroll-payment-form";
import { PayrollPaymentsList } from "@/modules/people/ui/payroll-payments-list";
import { DirectoryTable } from "@/modules/people/ui/directory-table";
import { EmployeeForm } from "@/modules/people/ui/profile-form";
import { PayrollChart } from "@/modules/people/ui/payroll-chart";
import { ActionError } from "@/shared/ui/action-error";
import { RequiresWrite, hasWrite } from "@/shared/ui/requires-write";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const canWrite =
    user !== null && can(user.role, "people_directory", "write");
  const seesCompensation =
    user !== null && can(user.role, "people_compensation", "read");

  const [directory, payroll, recentPayments, compensationWrite] =
    await Promise.all([
      getTeamDirectory(),
      seesCompensation ? getPayrollCostSeries() : null,
      seesCompensation ? listRecentPayrollPayments() : null,
      hasWrite("people_compensation"),
    ]);
  if (!directory.ok) return <ActionError message={directory.error} />;
  const employeeOptions = directory.data
    .filter((m) => m.active)
    .map((m) => ({ id: m.id, name: m.fullName }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {directory.data.length} personas en el directorio.
          </p>
        </div>
        {canWrite && <EmployeeForm />}
      </div>

      {directory.data.length === 0 ? (
        <EmptyState
          title="Directorio vacío"
          hint="Crea a las personas del equipo — el directorio es la base de nómina, ausencias y rentabilidad."
          action={canWrite ? <EmployeeForm /> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <DirectoryTable
            members={directory.data}
            canWrite={canWrite}
            today={today}
          />
        </div>
      )}

      {payroll !== null && (
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Costo de nómina · últimos 12 meses
            </h2>
            <RequiresWrite resource="people_compensation">
              <PayrollPaymentForm employees={employeeOptions} />
            </RequiresWrite>
          </div>
          {payroll.ok ? (
            <PayrollChart
              label={payroll.data.label}
              points={payroll.data.points}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{payroll.error}</p>
          )}
        </section>
      )}

      {recentPayments !== null && (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Pagos recientes</h2>
          {recentPayments.ok ? (
            <PayrollPaymentsList
              payments={recentPayments.data}
              canWrite={compensationWrite}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {recentPayments.error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
