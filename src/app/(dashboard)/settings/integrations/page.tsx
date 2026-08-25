import { getIntegrationsStatus } from "@/modules/settings/application/integrations-status-action";
import { IntegrationCard } from "@/modules/settings/ui/integration-card";
import { INTEGRATIONS_CATALOG } from "@/modules/settings/ui/integrations-catalog";
import { ActionError } from "@/shared/ui/action-error";

export default async function IntegrationsPage() {
  const result = await getIntegrationsStatus();
  if (!result.ok) return <ActionError message={result.error} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Integraciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credenciales de las fuentes externas. Se guardan cifradas; aquí
          nunca se muestran completas.
        </p>
      </div>
      {INTEGRATIONS_CATALOG.map((meta) => (
        <IntegrationCard
          key={meta.integration}
          meta={meta}
          status={result.data[meta.integration]}
        />
      ))}
    </div>
  );
}
