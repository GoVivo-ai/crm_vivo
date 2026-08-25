import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { getFinanceDashboard } from "@/modules/finance/application/finance-actions";
import { getMarketingDashboard } from "@/modules/marketing/application/marketing-actions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import { readableResources } from "@/modules/identity/domain/permissions";
import { StatTile } from "@/modules/finance/ui/stat-tile";
import { HomePanel, HomeSyncPanel } from "@/shared/ui/home-panels";
import { formatCurrency } from "@/shared/ui/format";

/**
 * Home ejecutivo 360 (Fase 5), compuesto por rol: cada panel se consulta
 * y pinta solo si el rol puede leer ese módulo. Todo sale de Postgres.
 */
export default async function DashboardHome() {
  const user = await getCurrentUser();
  const allowed = user ? readableResources(user.role) : [];

  const [board, finance, marketing] = await Promise.all([
    allowed.includes("crm") ? getPipelineBoard() : null,
    allowed.includes("finance") ? getFinanceDashboard() : null,
    allowed.includes("marketing") ? getMarketingDashboard({}) : null,
  ]);

  const open =
    board?.ok === true
      ? board.data.stages
          .filter((s) => !s.isWon && !s.isLost)
          .flatMap((s) =>
            s.deals.map((d) => ({
              amount: d.amount ?? 0,
              probability: s.probability,
            })),
          )
      : null;
  const pipelineTotal = open?.reduce((sum, d) => sum + d.amount, 0) ?? null;
  const forecast =
    open?.reduce((sum, d) => sum + (d.amount * d.probability) / 100, 0) ?? null;

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
                <StatTile
                  label="Pipeline abierto"
                  amount={pipelineTotal}
                  detail={`${open?.length ?? 0} deals`}
                />
                <StatTile
                  label="Forecast ponderado"
                  amount={forecast !== null ? Math.round(forecast) : null}
                  detail="por probabilidad de etapa"
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
                <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Spend</p>
                  <div className="font-mono text-xl leading-tight">
                    {Object.entries(mkt.totals.spendByCurrency).length === 0
                      ? "—"
                      : Object.entries(mkt.totals.spendByCurrency).map(
                          ([currency, amount]) => (
                            <p key={currency}>
                              {formatCurrency(amount, currency)}
                            </p>
                          ),
                        )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {marketing.ok ? "" : marketing.error}
              </p>
            )}
          </HomePanel>
        )}

        {allowed.includes("clients") && (
          <HomePanel title="Clientes" href="/clients">
            <p className="text-sm text-muted-foreground">
              MRR global y salud de proyectos llegan cuando backend publique
              el resumen agregado; mientras tanto revisa cada cuenta en su
              vista 360.
            </p>
          </HomePanel>
        )}
      </div>

      <HomeSyncPanel />

      {pipelineTotal !== null && pipelineTotal > 0 && (
        <p className="text-xs text-muted-foreground">
          Pipeline y forecast en COP; los deals sin monto cuentan como 0.
        </p>
      )}
    </div>
  );
}
