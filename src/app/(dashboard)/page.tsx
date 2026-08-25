import { getClientsSummary } from "@/modules/clients/application/clients-summary-action";
import { HealthBadge } from "@/modules/clients/ui/health-badge";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { getFinanceDashboard } from "@/modules/finance/application/finance-actions";
import { getMarketingDashboard } from "@/modules/marketing/application/marketing-actions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { readableResources } from "@/modules/identity/domain/permissions";
import { StatTile } from "@/modules/finance/ui/stat-tile";
import { HomePanel, HomeSyncPanel, MoneyTile } from "@/shared/ui/home-panels";

/**
 * Home ejecutivo 360 (Fase 5), compuesto por rol: cada panel se consulta
 * y pinta solo si el rol puede leer ese módulo. Todo sale de Postgres.
 */
export default async function DashboardHome() {
  const user = await getCurrentUser();
  const allowed = user ? readableResources(user.role) : [];

  const [board, finance, marketing, clients] = await Promise.all([
    allowed.includes("crm") ? getPipelineBoard() : null,
    allowed.includes("finance") ? getFinanceDashboard() : null,
    allowed.includes("marketing") ? getMarketingDashboard({}) : null,
    allowed.includes("clients") ? getClientsSummary() : null,
  ]);

  // Agregados por moneda: nunca se suman monedas distintas (multimoneda
  // contemplada en el plan aunque hoy los deals sean COP).
  const open =
    board?.ok === true
      ? board.data.stages
          .filter((s) => !s.isWon && !s.isLost)
          .flatMap((s) =>
            s.deals.map((d) => ({
              amount: d.amount ?? 0,
              currency: d.currency,
              probability: s.probability,
            })),
          )
      : null;
  const pipelineByCurrency: Record<string, number> = {};
  const forecastByCurrency: Record<string, number> = {};
  for (const d of open ?? []) {
    pipelineByCurrency[d.currency] =
      (pipelineByCurrency[d.currency] ?? 0) + d.amount;
    forecastByCurrency[d.currency] =
      (forecastByCurrency[d.currency] ?? 0) + (d.amount * d.probability) / 100;
  }

  const aging = finance?.ok === true ? finance.data.receivables.aging : null;
  const overdue =
    aging
      ?.filter((b) => b.bucket !== "current")
      .reduce((sum, b) => sum + b.amountCop, 0) ?? null;

  const mkt = marketing?.ok === true ? marketing.data : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">360</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {board !== null && (
          <HomePanel title="Pipeline comercial" href="/crm/pipeline">
            {board.ok ? (
              <div className="grid grid-cols-2 gap-3">
                <MoneyTile
                  label="Pipeline abierto"
                  amounts={pipelineByCurrency}
                  detail={`${open?.length ?? 0} deals`}
                />
                <MoneyTile
                  label="Forecast ponderado"
                  amounts={forecastByCurrency}
                  detail="por probabilidad de etapa"
                  round
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{board.error}</p>
            )}
          </HomePanel>
        )}

        {finance !== null && (
          <HomePanel title="Finanzas" href="/finance">
            {finance.ok ? (
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Cartera vencida"
                  amount={overdue}
                  detail={`${finance.data.receivables.openInvoices} facturas abiertas`}
                />
                <StatTile
                  label="Saldo en bancos"
                  amount={
                    finance.data.cashflowCurrentMonth?.finalBalance ?? null
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{finance.error}</p>
            )}
          </HomePanel>
        )}

        {marketing !== null && (
          <HomePanel title="Marketing · últimos 30 días" href="/marketing">
            {mkt ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="font-mono text-xl">{mkt.totals.leads}</p>
                </div>
                <MoneyTile label="Spend" amounts={mkt.totals.spendByCurrency} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {marketing.ok ? "" : marketing.error}
              </p>
            )}
          </HomePanel>
        )}

        {clients !== null && (
          <HomePanel title="Clientes" href="/clients">
            {clients.ok ? (
              <div className="grid grid-cols-2 gap-3">
                <MoneyTile
                  label="MRR"
                  amounts={clients.data.mrrByCurrency}
                  detail={`${clients.data.activeClients} clientes activos`}
                />
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">
                    Salud de proyectos
                  </p>
                  {(
                    ["green", "yellow", "red", "unknown"] as const
                  ).map((health) => (
                    <span key={health} className="flex items-center gap-2">
                      <HealthBadge health={health} />
                      <span className="ml-auto font-mono text-xs">
                        {clients.data.projectsByHealth[health]}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{clients.error}</p>
            )}
          </HomePanel>
        )}
      </div>

      <HomeSyncPanel />

      {(open?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Pipeline y forecast desglosados por la moneda de cada deal; los
          deals sin monto cuentan como 0.
        </p>
      )}
    </div>
  );
}
