import {
  IdentityCell,
  LIST_TH,
  ListFooter,
} from "@/shared/ui/entity/list-bits";
import { listServices } from "@/modules/clients/application/services-actions";
import { ServiceForm } from "@/modules/clients/ui/service-form";
import { ActionError } from "@/shared/ui/action-error";
import { formatMoney } from "@/shared/ui/format";

export default async function ServicesPage() {
  const result = await listServices();
  if (!result.ok) return <ActionError message={result.error} />;
  const services = result.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de la agencia; el fee real se pacta al contratar por
            cliente.
          </p>
        </div>
        <ServiceForm />
      </div>

      {services.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          El catálogo está vacío. Crea el primer servicio.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b">
                <th className={LIST_TH}>Servicio</th>
                <th className={LIST_TH}>Descripción</th>
                <th className={`${LIST_TH} text-right`}>Fee sugerido</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="relative border-b border-[#EDF0F5] last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <IdentityCell
                      id={service.id}
                      name={service.name}
                      sub={service.isActive ? "Activo" : "Inactivo"}
                    />
                  </td>
                  <td className="max-w-md px-5 py-3 text-muted-foreground">
                    {service.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold whitespace-nowrap tabular-nums">
                    {service.defaultMonthlyFee !== null
                      ? formatMoney(service.defaultMonthlyFee)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListFooter shown={services.length} total={services.length} />
        </div>
      )}
    </div>
  );
}
