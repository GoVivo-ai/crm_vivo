import { ArrowLeft, BarChart3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount } from "@/modules/crm/application/accounts-actions";
import {
  listActivitiesForDeal,
  listProposalsForDeal,
} from "@/modules/crm/application/activities-actions";
import { listContacts } from "@/modules/crm/application/contacts-actions";
import {
  getDeal,
  getPipelineBoard,
  listDealStageHistory,
} from "@/modules/crm/application/deals-actions";
import { listUserNames } from "@/modules/identity/application/list-user-names";
import { listServices } from "@/modules/clients/application/services-actions";
import { ConvertDealDialog } from "@/modules/clients/ui/convert-deal-dialog";
import { ActivityForm } from "@/modules/crm/ui/activity-form";
import { ActivityTimeline } from "@/modules/crm/ui/activity-timeline";
import { MarkLostButton } from "@/modules/crm/ui/deal/mark-lost-button";
import { StageStepper } from "@/modules/crm/ui/deal/stage-stepper";
import { DealSidePanel } from "@/modules/crm/ui/deal/side-panel";
import { ProposalStatusBadge } from "@/modules/crm/ui/labels";
import { ProposalForm } from "@/modules/crm/ui/proposal-form";
import { ActionError } from "@/shared/ui/action-error";
import { EntityHeader } from "@/shared/ui/entity/entity-header";
import { formatCurrency } from "@/shared/ui/format";
import { CrumbTitle } from "@/shared/ui/page-title";
import { hasWrite, RequiresWrite } from "@/shared/ui/requires-write";
import { daysUntil, formatIsoDate } from "@/modules/people/ui/file/helpers";

export default async function DealDetailPage({
  params,
}: PageProps<"/crm/deals/[id]">) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);
  const dealResult = await getDeal(id);
  if (!dealResult.ok) {
    if (dealResult.error === "No encontrado") notFound();
    return <ActionError message={dealResult.error} />;
  }
  const deal = dealResult.data;

  const boardResult = await getPipelineBoard();
  if (!boardResult.ok) return <ActionError message={boardResult.error} />;
  const stages = boardResult.data.stages;
  const stage = stages.find((s) => s.id === deal.stageId);
  if (!stage) return <ActionError message="Etapa del negocio no disponible" />;

  const [
    accountResult,
    activitiesResult,
    proposalsResult,
    catalogResult,
    contactsResult,
    historyResult,
    namesResult,
    canWrite,
  ] = await Promise.all([
    getAccount(deal.accountId),
    listActivitiesForDeal(deal.id),
    listProposalsForDeal(deal.id),
    listServices(),
    listContacts(),
    listDealStageHistory(deal.id),
    listUserNames(),
    hasWrite("crm"),
  ]);
  const account = accountResult.ok ? accountResult.data : null;
  const activities = activitiesResult.ok ? activitiesResult.data : [];
  const proposals = proposalsResult.ok ? proposalsResult.data : [];
  const catalog = catalogResult.ok
    ? catalogResult.data.filter((s) => s.isActive)
    : [];
  const accountContacts = (contactsResult.ok ? contactsResult.data : []).filter(
    (c) => c.accountId === deal.accountId,
  );
  const contact = accountContacts.find((c) => c.id === deal.contactId) ?? null;

  // Stepper: etapas abiertas + ganada en orden; la perdida va aparte.
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const stepperStages = ordered
    .filter((s) => !s.isLost)
    .map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      nextPosition: s.deals.length,
    }));
  const lostStage = ordered.find((s) => s.isLost) ?? null;

  // Métricas de la cuenta madre desde el board (sin contrato extra).
  const accountDeals = stages.flatMap((s) =>
    s.deals.filter((d) => d.accountId === deal.accountId).map((d) => ({ ...d, stage: s })),
  );
  const openDeals = accountDeals.filter((d) => !d.stage.isWon && !d.stage.isLost);
  const wonCount = accountDeals.filter((d) => d.stage.isWon).length;
  const openSum = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0);

  const daysInStage = Math.max(
    0,
    -daysUntil(deal.stageEnteredAt.toISOString().slice(0, 10), today),
  );
  const createdDays = Math.max(
    0,
    -daysUntil(deal.createdAt.toISOString().slice(0, 10), today),
  );
  const isOpen = !stage.isWon && !stage.isLost;

  // Hitos de sistema (§15.1): historial real de transiciones; si el
  // deal es anterior al registro, cae al hito único de stageEnteredAt.
  const names = new Map(
    (namesResult.ok ? namesResult.data : []).map((u) => [u.id, u.name]),
  );
  const history = historyResult.ok ? historyResult.data : [];
  const milestones =
    history.length > 0
      ? history.map((e) => ({
          id: e.id,
          title:
            e.fromStageName === null
              ? `Creado en ${e.toStageName}`
              : `Pasó a ${e.toStageName}`,
          at: e.movedAt,
          by: e.movedBy ? (names.get(e.movedBy) ?? null) : null,
        }))
      : isOpen
        ? [{ id: `stage-${deal.stageId}`, title: `Pasó a ${stage.name}`, at: deal.stageEnteredAt }]
        : [];

  const owner = deal.ownerId ? (names.get(deal.ownerId) ?? null) : null;
  const meta = [
    account?.name,
    contact ? `contacto ${contact.name}` : null,
    owner ? `responsable ${owner}` : null,
    `creado hace ${createdDays} día${createdDays === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <CrumbTitle title={deal.title} />
      <Link
        href="/crm/pipeline"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Pipeline
      </Link>

      <EntityHeader
        tile={{
          content: <BarChart3 className="size-[22px]" strokeWidth={1.9} />,
          bg: "#E6F9F1",
          fg: "#069B66",
        }}
        name={deal.title}
        badges={
          <>
            {stage.isWon && (
              <span className="rounded-full bg-[#E6F9F1] px-2.5 py-1 text-[11px] font-extrabold text-[#069B66]">
                Ganado
              </span>
            )}
            {stage.isLost && (
              <span className="rounded-full bg-[#FAEAEA] px-2.5 py-1 text-[11px] font-extrabold text-[#C93A3A]">
                Perdido
              </span>
            )}
            {isOpen && daysInStage >= 10 && (
              <span className="rounded-full bg-[#FBF7D9] px-2.5 py-1 text-[11px] font-extrabold text-[#8C7A0A]">
                {daysInStage} días en la etapa
              </span>
            )}
          </>
        }
        meta={meta}
        stats={[
          {
            label: "Valor",
            value:
              deal.amount !== null
                ? formatCurrency(deal.amount, deal.currency)
                : "—",
          },
          {
            label: "Cierre estimado",
            value: deal.expectedCloseDate
              ? formatIsoDate(deal.expectedCloseDate)
              : "—",
            small: true,
          },
        ]}
        actions={
          isOpen && (
            <RequiresWrite resource="crm">
              {lostStage && (
                <MarkLostButton
                  dealId={deal.id}
                  dealTitle={deal.title}
                  lostStageId={lostStage.id}
                  nextPosition={lostStage.deals.length}
                />
              )}
              <ConvertDealDialog dealId={deal.id} catalog={catalog} today={today} />
            </RequiresWrite>
          )
        }
      >
        {isOpen && (
          <StageStepper
            dealId={deal.id}
            stages={stepperStages}
            currentStageId={deal.stageId}
            canWrite={canWrite}
          />
        )}
      </EntityHeader>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
            <div className="flex items-center gap-2.5 px-5 pt-4">
              <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
                Actividades
              </h2>
              <span className="ml-auto">
                <RequiresWrite resource="crm">
                  <ActivityForm dealId={deal.id} />
                </RequiresWrite>
              </span>
            </div>
            <div className="px-5 pt-3.5 pb-5">
              <ActivityTimeline
                activities={activities}
                milestones={milestones}
                authors={Object.fromEntries(names)}
              />
            </div>
          </section>

          <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
            <div className="flex items-center gap-2.5 px-5 pt-4">
              <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
                Propuestas
              </h2>
              <span className="ml-auto">
                <RequiresWrite resource="crm">
                  <ProposalForm dealId={deal.id} />
                </RequiresWrite>
              </span>
            </div>
            <div className="px-5 pt-3 pb-5">
              {proposals.length === 0 ? (
                <p className="rounded-xl border-[1.5px] border-dashed border-[#C6CFDD] p-4 text-center text-[12.5px] font-bold text-[#8B99B0]">
                  Sin propuestas todavía — crea la primera para mover el
                  negocio adelante.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {proposals.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-2.5 border-b border-[#EDF0F5] py-2.5 last:border-b-0"
                    >
                      <span className="text-[12.5px] font-extrabold">{p.title}</span>
                      <ProposalStatusBadge status={p.status} />
                      {p.amount !== null && (
                        <span className="text-xs font-bold tabular-nums">
                          {formatCurrency(p.amount, deal.currency)}
                        </span>
                      )}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto flex items-center gap-1 text-xs font-extrabold text-[#069B66] hover:text-[#045C3D]"
                        >
                          Abrir <ExternalLink className="size-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <DealSidePanel
          deal={deal}
          account={account}
          contact={contact}
          contacts={accountContacts}
          canWrite={canWrite}
          openStats={{ count: openDeals.length, sumCop: openSum, won: wonCount }}
        />
      </div>
    </div>
  );
}
