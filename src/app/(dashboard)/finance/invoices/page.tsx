import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { listInvoices } from "@/modules/finance/application/invoices-actions";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { InvoicesTable } from "@/modules/finance/ui/invoices-table";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";
import { NativeSelect } from "@/shared/ui/native-select";

export default async function InvoicesPage({
  searchParams,
}: PageProps<"/finance/invoices">) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" && params.status !== ""
      ? (params.status as "open" | "paid" | "void")
      : null;

  const [invoicesResult, accountsResult] = await Promise.all([
    listInvoices({ status }),
    listAccounts(),
  ]);
  if (!invoicesResult.ok)
    return <ActionError message={invoicesResult.error} />;

  const accounts = accountsResult.ok
    ? accountsResult.data.map(({ id, name }) => ({ id, name }))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/finance"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Finanzas
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Facturas</h1>
        <div className="flex items-center gap-2">
          <form action="/finance/invoices">
            <NativeSelect
              name="status"
              defaultValue={status ?? ""}
              className="w-36"
              aria-label="Filtrar por estado"
              onChange={undefined}
            >
              <option value="">Todas</option>
              <option value="open">Abiertas</option>
              <option value="paid">Pagadas</option>
              <option value="void">Anuladas</option>
            </NativeSelect>
            <button type="submit" className="sr-only">
              Filtrar
            </button>
          </form>
          <InvoiceForm accounts={accounts} />
        </div>
      </div>

      {invoicesResult.data.length === 0 ? (
        <EmptyState
          title="Sin facturas"
          hint="Registra tu primera factura de ingreso o conecta QuickBooks para traerlas."
          action={<InvoiceForm accounts={accounts} />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <InvoicesTable invoices={invoicesResult.data} accounts={accounts} />
        </div>
      )}
    </div>
  );
}
