import { getProfitabilityDashboard } from "@/modules/profitability/application/profitability-dashboard-action";
import { ProfitabilityTable } from "@/modules/profitability/ui/profitability-table";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";
import { Kpi } from "@/shared/ui/kpi";

export default async function ProfitabilityPage() {
  const result = await getProfitabilityDashboard({});
  if (!result.ok) return <ActionError message={result.error} />;

  const {
    period,
    totalPayrollCop,
    totalAssignedPercent,
    unassignedCostCop,
    activeEmployees,
    accounts,
  } = result.data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Rentabilidad por cliente</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {period.from} → {period.to}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Costo de nómina del periodo"
          value={totalPayrollCop}
          kind="accounting"
          detail="serie: nómina (pagos registrados)"
        />
        <Kpi
          label="Costo sin asignar (compañía)"
          value={unassignedCostCop}
          kind="accounting"
          detail="nómina no asignada a clientes"
        />
        <Kpi
          label="Dedicación asignada"
          value={totalAssignedPercent}
          kind="count"
          detail={`% del total · ${activeEmployees} personas activas`}
        />
        <Kpi
          label="Clientes con margen"
          value={accounts.length}
          kind="count"
        />
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Sin datos de rentabilidad"
          hint="Asigna personas a clientes en Asignaciones y registra facturas y pagos de nómina para cruzar ingresos con costo de personal."
        />
      ) : (
        <section className="overflow-x-auto rounded-lg border bg-card">
          <ProfitabilityTable accounts={accounts} />
        </section>
      )}

      <p className="max-w-3xl text-xs text-muted-foreground">
        Método: costo real desde los pagos de nómina registrados por persona,
        prorrateado por su % de dedicación; lo no asignado queda como costo de
        compañía. Headcount activo: {activeEmployees}. La pauta gestionada se
        muestra aparte y no está restada del margen.
      </p>
    </div>
  );
}
