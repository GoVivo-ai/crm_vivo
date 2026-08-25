import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

/** Cuentas que ya son (o fueron) clientes — las prospect viven en CRM. */
export default async function ClientsPage() {
  const result = await listAccounts();
  if (!result.ok) return <ActionError message={result.error} />;

  const clients = result.data.filter((a) => a.status !== "prospect");

  return (
    <div className="flex flex-col gap-4">
      {clients.length === 0 ? (
        <EmptyState
          title="Aún no hay clientes"
          hint="Cuando un negocio se marque ganado en el pipeline, la cuenta aparecerá aquí con sus servicios, proyectos y MRR."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Industria</TableHead>
                <TableHead>NIT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clients/${account.id}`}
                      className="hover:underline"
                    >
                      {account.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <AccountStatusBadge status={account.status} />
                  </TableCell>
                  <TableCell>{account.industry ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {account.nit ?? "—"}
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
