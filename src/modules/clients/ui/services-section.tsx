import type {
  AccountServiceWithName,
  Service,
} from "@/modules/clients/domain/types";
import { AddServiceForm } from "@/modules/clients/ui/add-service-form";
import { EndServiceButton } from "@/modules/clients/ui/end-service-button";
import { formatMoney } from "@/shared/ui/format";

type ServicesSectionProps = {
  accountId: string;
  services: AccountServiceWithName[];
  catalog: Service[];
  today: string;
};

/** Servicios contratados de la cuenta, activos primero. */
export function ServicesSection({
  accountId,
  services,
  catalog,
  today,
}: ServicesSectionProps) {
  const active = services.filter((s) => s.isActive);
  const ended = services.filter((s) => !s.isActive);

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Servicios contratados</h2>
        <AddServiceForm accountId={accountId} catalog={catalog} today={today} />
      </div>
      {active.length === 0 && ended.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin servicios contratados todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
            >
              <span className="text-sm font-medium">{s.serviceName}</span>
              <span className="font-mono text-xs">
                {formatMoney(s.monthlyFee)}/mes
              </span>
              <span className="text-xs text-muted-foreground">
                desde {s.startDate}
              </span>
              <div className="ml-auto">
                <EndServiceButton
                  accountServiceId={s.id}
                  serviceName={s.serviceName}
                  today={today}
                />
              </div>
            </li>
          ))}
          {ended.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 opacity-60"
            >
              <span className="text-sm">{s.serviceName}</span>
              <span className="font-mono text-xs">
                {formatMoney(s.monthlyFee)}/mes
              </span>
              <span className="text-xs text-muted-foreground">
                {s.startDate} → {s.endDate}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
