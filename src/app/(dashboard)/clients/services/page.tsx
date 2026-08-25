import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Fee sugerido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {service.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {service.defaultMonthlyFee !== null
                      ? formatMoney(service.defaultMonthlyFee)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
