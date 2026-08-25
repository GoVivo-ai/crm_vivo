import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteBankTransaction } from "@/modules/treasury/application/treasury-actions";
import type { BankTransactionView } from "@/modules/treasury/domain/types";
import { DeleteRecordButton } from "@/shared/ui/delete-record-button";
import { formatMoney } from "@/shared/ui/format";

/** Últimos movimientos registrados; entradas en verde, salidas en tinta. */
export function TransactionsTable({
  transactions,
}: {
  transactions: BankTransactionView[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Cuenta</TableHead>
          <TableHead>Detalle</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const isIn = tx.direction === "in";
          return (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {tx.date}
              </TableCell>
              <TableCell className="text-sm">{tx.bankName ?? "—"}</TableCell>
              <TableCell className="max-w-80 truncate text-sm">
                {tx.description ?? "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono text-xs whitespace-nowrap",
                  isIn && "text-health-ok",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {isIn ? (
                    <ArrowDownLeft className="size-3" />
                  ) : (
                    <ArrowUpRight className="size-3 text-muted-foreground" />
                  )}
                  {isIn ? "+" : "−"}
                  {formatMoney(Math.abs(tx.amount))}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DeleteRecordButton
                  action={deleteBankTransaction}
                  id={tx.id}
                  confirmText={`¿Borrar el movimiento del ${tx.date} por ${formatMoney(tx.amount)}?`}
                  successMessage="Movimiento borrado"
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
