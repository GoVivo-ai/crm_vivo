import { getIntegrationsStatus } from "@/modules/settings/application/integrations-status-action";
import { SyncRunsPanel } from "@/modules/settings/ui/sync-runs-panel";
import { OAuthCallbackToast } from "@/modules/settings/ui/oauth-callback-toast";
import { IntegrationCard } from "@/modules/settings/ui/integration-card";
import { INTEGRATIONS_CATALOG } from "@/modules/settings/ui/integrations-catalog";
import { ActionError } from "@/shared/ui/action-error";

export default async function IntegrationsPage() {
  const result = await getIntegrationsStatus();
  if (!result.ok) return <ActionError message={result.error} />;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <OAuthCallbackToast />
      <div>
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
            today={today}
          />
        ))}
      </div>

      {/* Disponible próximamente (artboard): card punteada, sin acción. */}
      <div className="flex items-center gap-3.5 rounded-xl border border-dashed bg-card px-5 py-4">
        <span className="grid size-9 place-items-center rounded-lg bg-[#EEF1F6] text-xl font-bold text-muted-foreground/60">
          +
        </span>
        <div className="flex-1">
          <p className="text-[13.5px] font-extrabold">Google Workspace</p>
          <p className="text-[11.5px] font-semibold text-muted-foreground">
            Calendario y correo del equipo · disponible próximamente
          </p>
        </div>
      </div>

      <SyncRunsPanel />
    </div>
  );
}
