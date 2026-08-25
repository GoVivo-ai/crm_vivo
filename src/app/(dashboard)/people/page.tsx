import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { can } from "@/modules/identity/domain/permissions";
import {
  getPayrollCostSeries,
  getTeamDirectory,
} from "@/modules/people/application/team-actions";
import { DirectoryTable } from "@/modules/people/ui/directory-table";
import { PayrollChart } from "@/modules/people/ui/payroll-chart";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function PeoplePage() {
  const user = await getCurrentUser();
  const canWrite =
    user !== null && can(user.role, "people_directory", "write");
  const seesCompensation =
    user !== null && can(user.role, "people_compensation", "read");

  const [directory, payroll] = await Promise.all([
    getTeamDirectory(),
    seesCompensation ? getPayrollCostSeries() : null,
  ]);
  if (!directory.ok) return <ActionError message={directory.error} />;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {directory.data.length} personas en el directorio.
        </p>
      </div>

      {directory.data.length === 0 ? (
        <EmptyState
          title="Directorio vacío"
          hint="Corre la sincronización ERP de Alegra para traer al equipo."
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
          <h2 className="mb-3 text-sm font-semibold">
            Costo de nómina · últimos 12 meses
          </h2>
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
    </div>
  );
}
