import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { listAccountOptionsForInvoicing } from "@/modules/finance/application/account-options-action";
import { RequiresWrite, hasWrite } from "@/shared/ui/requires-write";
import { listInvoices } from "@/modules/finance/application/invoices-actions";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { InvoicesTable } from "@/modules/finance/ui/invoices-table";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";
import type { Route } from "next";
import { cn } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams,
}: PageProps<"/finance/invoices">) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" && params.status !== ""
      ? (params.status as "open" | "paid" | "void")
      : null;

  const [invoicesResult, accountsResult, canWrite] = await Promise.all([
    listInvoices(),
    listAccountOptionsForInvoicing(),
    hasWrite("finance"),
  ]);
  if (!invoicesResult.ok)
    return <ActionError message={invoicesResult.error} />;

  const accounts = accountsResult.ok ? accountsResult.data : [];
  const all = invoicesResult.data;
  const counts = {
    open: all.filter((i) => i.status === "open").length,
    paid: all.filter((i) => i.status === "paid").length,
    void: all.filter((i) => i.status === "void").length,
  };
  const invoices = status ? all.filter((i) => i.status === status) : all;

  // Chips de estado (patrón del artboard): filtrar es navegación visible.
  const chips: {
    href: string;
    label: string;
    active: boolean;
    activeClass: string;
  }[] = [
    {
      href: "/finance/invoices",
      label: `Todas ${all.length}`,
      active: status === null,
      activeClass: "bg-[#E7EBF3] text-[#011640]",
    },
    {
      href: "/finance/invoices?status=open",
      label: `Abiertas ${counts.open}`,
      active: status === "open",
      activeClass: "bg-[#FBF7D9] text-[#8C7A0A]",
    },
    {
      href: "/finance/invoices?status=paid",
      label: `Pagadas ${counts.paid}`,
      active: status === "paid",
      activeClass: "bg-[#E6F9F1] text-[#069B66]",
    },
    {
      href: "/finance/invoices?status=void",
      label: `Anuladas ${counts.void}`,
      active: status === "void",
      activeClass: "bg-[#EEF1F6] text-[#5A6B85]",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/finance"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Finanzas
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <RequiresWrite resource="finance">
          <InvoiceForm accounts={accounts} />
        </RequiresWrite>
      </div>

      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href as Route}
            aria-current={chip.active ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-[11.5px] font-extrabold transition-colors",
              chip.active
                ? chip.activeClass
                : "bg-[#EEF1F6] text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </nav>

      {invoices.length === 0 ? (
        <EmptyState
          title={status ? "Sin facturas en este estado" : "Sin facturas"}
          hint={
            status
              ? "Cambia de chip para ver otros estados."
              : "Registra tu primera factura de ingreso o conecta QuickBooks para traerlas."
          }
          action={
            canWrite && !status ? <InvoiceForm accounts={accounts} /> : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <InvoicesTable
            invoices={invoices}
            accounts={accounts}
            canWrite={canWrite}
          />
        </div>
      )}
    </div>
  );
}
