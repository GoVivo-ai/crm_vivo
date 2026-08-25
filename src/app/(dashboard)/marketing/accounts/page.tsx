import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { getAdAccounts } from "@/modules/marketing/application/marketing-actions";
import { AdAccountsTable } from "@/modules/marketing/ui/ad-accounts-table";
import { ActionError } from "@/shared/ui/action-error";

export default async function AdAccountsPage() {
  const [adAccountsResult, accountsResult] = await Promise.all([
    getAdAccounts(),
    listAccounts(),
  ]);
  if (!adAccountsResult.ok)
    return <ActionError message={adAccountsResult.error} />;

  const adAccounts = adAccountsResult.data;
  const pendingCount = adAccounts.filter((a) => a.accountId === null).length;
  const clients = accountsResult.ok
    ? accountsResult.data.map(({ id, name }) => ({ id, name }))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cuentas publicitarias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vincula cada cuenta de ads con su cliente para poder filtrar el
          dashboard por cliente.
          {pendingCount > 0 && (
            <span className="text-health-warn">
              {" "}
              {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} de
              vincular.
            </span>
          )}
        </p>
      </div>
      {adAccounts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Sin cuentas publicitarias sincronizadas todavía — corre el sync de
          Windsor.
        </p>
      ) : (
        <AdAccountsTable adAccounts={adAccounts} clients={clients} />
      )}
    </div>
  );
}
