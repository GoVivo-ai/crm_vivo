import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteInvoice } from "@/modules/finance/application/invoices-actions";
import type { Invoice } from "@/modules/finance/domain/types";
import { InvoiceForm } from "@/modules/finance/ui/invoice-form";
import { DeleteRecordButton } from "@/shared/ui/delete-record-button";
import { formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  open: "Abierta",
  paid: "Pagada",
  void: "Anulada",
};

type InvoicesTableProps = {
  invoices: Invoice[];
  accounts: { id: string; name: string }[];
  /** finance:write — sin él no se renderizan editar/borrar. */
  canWrite: boolean;
};

/** Facturas de ingreso; las manuales se editan/borran, QB solo lectura. */
export function InvoicesTable({
  invoices,
  accounts,
  canWrite,
}: InvoicesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Emitida</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Fuente</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className={cn(invoice.status === "void" && "opacity-50")}
          >
            <TableCell className="max-w-56 truncate text-sm font-medium">
              {invoice.accountName ?? invoice.clientName ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {invoice.number ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {invoice.issueDate}
            </TableCell>
            <TableCell className="text-sm">
              {STATUS_LABELS[invoice.status]}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatCurrency(invoice.total, invoice.currencyCode)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-mono text-xs",
                invoice.balance > 0 && invoice.status === "open"
                  ? "text-health-warn"
                  : "text-muted-foreground",
              )}
            >
              {formatCurrency(invoice.balance, invoice.currencyCode)}
            </TableCell>
            <TableCell>
              <SourceBadge source={invoice.source} />
            </TableCell>
            <TableCell className="text-right">
              {canWrite && invoice.source === "manual" && (
                <span className="inline-flex items-center gap-1">
                  <InvoiceForm invoice={invoice} accounts={accounts} />
                  <DeleteRecordButton
                    action={deleteInvoice}
                    id={invoice.id}
                    title={`¿Borrar la factura ${invoice.number ?? "sin número"} de ${invoice.accountName ?? invoice.clientName ?? "?"}?`}
                    body="Se borra el registro y deja de contar en facturación y cartera. Esta acción no se puede deshacer."
                    confirmLabel="Borrar factura"
                    successMessage={`Factura ${invoice.number ?? ""} borrada`.trim()}
                  />
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
