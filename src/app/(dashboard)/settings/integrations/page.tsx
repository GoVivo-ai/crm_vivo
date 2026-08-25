import { getIntegrationsStatus } from "@/modules/settings/application/integrations-status-action";
import { IntegrationCard } from "@/modules/settings/ui/integration-card";
import { INTEGRATIONS_CATALOG } from "@/modules/settings/ui/integrations-catalog";
import { ActionError } from "@/shared/ui/action-error";

export default async function IntegrationsPage() {
  const result = await getIntegrationsStatus();
  if (!result.ok) return <ActionError message={result.error} />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Integraciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credenciales de las fuentes externas. Se guardan cifradas; aquí
          nunca se muestran completas.
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS_CATALOG.map((meta) => (
          <IntegrationCard
            key={meta.integration}
            meta={meta}
            status={result.data[meta.integration]}
          />
        ))}
      </div>
    </div>
  );
}
