import { Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { AccountForm } from "@/modules/crm/ui/account-form";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function AccountsPage({
  searchParams,
}: PageProps<"/crm/accounts">) {
  const { q } = await searchParams;
  const search = typeof q === "string" && q !== "" ? q : null;

  const result = await listAccounts({ search });
  if (!result.ok) return <ActionError message={result.error} />;
  const accounts = result.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <div className="flex items-center gap-2">
          <form className="relative" action="/crm/accounts">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar cuenta…"
              defaultValue={search ?? ""}
              className="w-56 pl-8"
            />
          </form>
          <AccountForm triggerLabel="Nueva cuenta" />
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "Aún no hay cuentas"}
          hint={
            search
              ? "Prueba con otro nombre o revisa la ortografía."
              : "Las cuentas son las empresas con las que trabajas: de prospecto a cliente activo."
          }
          action={
            search ? undefined : (
              <AccountForm triggerLabel="Crear la primera cuenta" />
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Industria</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Sitio web</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/crm/accounts/${account.id}`}
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
                  <TableCell className="text-muted-foreground">
                    {account.website ?? "—"}
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
