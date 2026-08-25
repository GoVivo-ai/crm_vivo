import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount } from "@/modules/crm/application/accounts-actions";
import {
  listActivitiesForDeal,
  listProposalsForDeal,
} from "@/modules/crm/application/activities-actions";
import { listServices } from "@/modules/clients/application/services-actions";
import { ConvertDealDialog } from "@/modules/clients/ui/convert-deal-dialog";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { ActivityForm } from "@/modules/crm/ui/activity-form";
import { ActivityTimeline } from "@/modules/crm/ui/activity-timeline";
import { ProposalStatusBadge } from "@/modules/crm/ui/labels";
import { ProposalForm } from "@/modules/crm/ui/proposal-form";
import { ActionError } from "@/shared/ui/action-error";
import { formatMoney } from "@/shared/ui/format";

export default async function DealDetailPage({
  params,
}: PageProps<"/crm/deals/[id]">) {
  const { id } = await params;
  const boardResult = await getPipelineBoard();
  if (!boardResult.ok) return <ActionError message={boardResult.error} />;

  const stage = boardResult.data.stages.find((s) =>
    s.deals.some((d) => d.id === id),
  );
  const deal = stage?.deals.find((d) => d.id === id);
  if (!stage || !deal) notFound();

  const [accountResult, activitiesResult, proposalsResult, catalogResult] =
    await Promise.all([
      getAccount(deal.accountId),
      listActivitiesForDeal(deal.id),
      listProposalsForDeal(deal.id),
      listServices(),
    ]);
  const account = accountResult.ok ? accountResult.data : null;
  const activities = activitiesResult.ok ? activitiesResult.data : [];
  const proposals = proposalsResult.ok ? proposalsResult.data : [];
  const catalog = catalogResult.ok
    ? catalogResult.data.filter((s) => s.isActive)
    : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/crm/pipeline"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Pipeline
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{deal.title}</h1>
          <p className="text-sm text-muted-foreground">
            {account ? (
              <Link
                href={`/crm/accounts/${account.id}`}
                className="hover:underline"
              >
                {account.name}
              </Link>
            ) : (
              "Cuenta no disponible"
            )}
            {" · "}etapa <span className="font-medium">{stage.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-lg">
            {deal.amount !== null ? formatMoney(deal.amount) : "Sin monto"}
          </p>
          {deal.closedAt === null && !stage.isWon && !stage.isLost && (
            <ConvertDealDialog
              dealId={deal.id}
              catalog={catalog}
              today={new Date().toISOString().slice(0, 10)}
            />
          )}
        </div>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Actividades</h2>
          <ActivityForm dealId={deal.id} />
        </div>
        <ActivityTimeline activities={activities} />
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Propuestas</h2>
          <ProposalForm dealId={deal.id} />
        </div>
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin propuestas todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proposals.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
              >
                <span className="text-sm font-medium">{p.title}</span>
                <ProposalStatusBadge status={p.status} />
                {p.amount !== null && (
                  <span className="font-mono text-xs">
                    {formatMoney(p.amount)}
                  </span>
                )}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-module-clients hover:underline"
                  >
                    Abrir <ExternalLink className="size-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
