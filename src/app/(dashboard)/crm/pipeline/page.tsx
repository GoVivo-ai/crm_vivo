import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { getPipelineBoard } from "@/modules/crm/application/deals-actions";
import { DealForm } from "@/modules/crm/ui/pipeline/deal-form";
import { PipelineBoard } from "@/modules/crm/ui/pipeline/pipeline-board";
import { ActionError } from "@/shared/ui/action-error";

export default async function PipelinePage() {
  const [boardResult, accountsResult] = await Promise.all([
    getPipelineBoard(),
    listAccounts(),
  ]);
  if (!boardResult.ok) return <ActionError message={boardResult.error} />;
  if (!accountsResult.ok) return <ActionError message={accountsResult.error} />;

  const stages = boardResult.data.stages;
  const accountNames = new Map(
    accountsResult.data.map((a) => [a.id, a.name]),
  );
  const accountOptions = accountsResult.data.map(({ id, name }) => ({
    id,
    name,
  }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <DealForm
          accounts={accountOptions}
          stages={stages.map((s) => ({
            id: s.id,
            name: s.name,
            position: s.position,
            probability: s.probability,
            isWon: s.isWon,
            isLost: s.isLost,
          }))}
        />
      </div>
      <PipelineBoard
        initialStages={stages}
        accountNames={accountNames}
        today={today}
      />
    </div>
  );
}
