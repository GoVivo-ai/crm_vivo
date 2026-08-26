import { cn } from "@/lib/utils";
import type { Invoice } from "@/modules/finance/domain/types";
import { InvoiceRowActions } from "@/modules/finance/ui/invoice-row-actions";
import { formatIsoDate } from "@/modules/people/ui/file/helpers";
import { IdentityCell, LIST_TH, ListFooter } from "@/shared/ui/entity/list-bits";
import { formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const STATUS: Record<Invoice["status"], { label: string; cls: string }> = {
  open: { label: "Abierta", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
  paid: { label: "Pagada", cls: "bg-[#E6F9F1] text-[#069B66]" },
  void: { label: "Anulada", cls: "bg-[#EEF1F6] text-[#5A6B85]" },
};

type InvoicesTableProps = {
  invoices: Invoice[];
  accounts: { id: string; name: string }[];
  /** finance:write — sin él no se monta el menú de acciones. */
  canWrite: boolean;
  /** Total sin filtrar, para el footer "Mostrando N de M". */
  total: number;
};

/** Facturas al sistema §15.2: celda identidad, badges de tinta, fechas
 * es-CO, tabular; acciones en menú ⋯ (solo manuales). */
export function InvoicesTable({
  invoices,
  accounts,
  canWrite,
  total,
}: InvoicesTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] font-semibold">
          <thead>
            <tr className="border-b">
              <th className={LIST_TH}>Cliente</th>
              <th className={LIST_TH}>Emitida</th>
              <th className={`${LIST_TH} text-right`}>Total</th>
              <th className={`${LIST_TH} text-right`}>Saldo</th>
              <th className={LIST_TH}>Fuente</th>
              <th className={LIST_TH}>Estado</th>
              <th className={LIST_TH} aria-hidden />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const st = STATUS[invoice.status];
              return (
                <tr
                  key={invoice.id}
                  className={cn(
                    "border-b border-[#EDF0F5] last:border-b-0",
                    invoice.status === "void" && "opacity-60",
                  )}
                >
                  <td className="px-5 py-3">
                    <IdentityCell
                      id={invoice.accountId ?? invoice.id}
                      name={invoice.accountName ?? invoice.clientName ?? "—"}
                      sub={invoice.number ?? "Sin número"}
                    />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {formatIsoDate(invoice.issueDate)}
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold whitespace-nowrap tabular-nums">
                    {formatCurrency(invoice.total, invoice.currencyCode)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-3 text-right whitespace-nowrap tabular-nums",
                      invoice.balance > 0 && invoice.status === "open"
                        ? "font-extrabold text-[#8C7A0A]"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(invoice.balance, invoice.currencyCode)}
                  </td>
                  <td className="px-5 py-3">
                    <SourceBadge source={invoice.source} />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canWrite && invoice.source === "manual" && (
                      <InvoiceRowActions invoice={invoice} accounts={accounts} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ListFooter shown={invoices.length} total={total} />
    </>
  );
}
