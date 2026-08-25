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
import type { BankTransactionView } from "@/modules/treasury/domain/types";
import { formatMoney } from "@/shared/ui/format";

/** Últimos movimientos bancarios; entradas en verde, salidas en tinta. */
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
          <TableHead>Banco</TableHead>
          <TableHead>Tercero / detalle</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const isIn = tx.type === "in";
          return (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {tx.date ?? "—"}
              </TableCell>
              <TableCell className="text-sm">{tx.bankName ?? "—"}</TableCell>
              <TableCell className="max-w-80">
                <p className="truncate text-sm">
                  {tx.clientName ?? tx.anotation ?? "—"}
                </p>
                {tx.associations && (
                  <p className="truncate text-xs text-muted-foreground">
                    {tx.associations}
                  </p>
                )}
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
                  {tx.amount !== null ? formatMoney(Math.abs(tx.amount)) : "—"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
