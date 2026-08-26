import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankTransactionView } from "@/modules/treasury/domain/types";
import { TransactionRowActions } from "@/modules/treasury/ui/transaction-row-actions";
import { formatIsoDate } from "@/modules/people/ui/file/helpers";
import { LIST_TH } from "@/shared/ui/entity/list-bits";
import { formatMoney } from "@/shared/ui/format";

/** Movimientos al sistema §15.2: fechas es-CO, tabular, menú ⋯. */
export function TransactionsTable({
  transactions,
  canWrite,
}: {
  transactions: BankTransactionView[];
  /** treasury:write — sin él no se monta el menú de acciones. */
  canWrite: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] font-semibold">
        <thead>
          <tr className="border-b">
            <th className={LIST_TH}>Fecha</th>
            <th className={LIST_TH}>Cuenta</th>
            <th className={LIST_TH}>Detalle</th>
            <th className={`${LIST_TH} text-right`}>Monto</th>
            <th className={LIST_TH} aria-hidden />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIn = tx.direction === "in";
            return (
              <tr key={tx.id} className="border-b border-[#EDF0F5] last:border-b-0">
                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                  {formatIsoDate(tx.date)}
                </td>
                <td className="px-5 py-3 font-extrabold">{tx.bankName ?? "—"}</td>
                <td className="max-w-80 truncate px-5 py-3 text-muted-foreground">
                  {tx.description ?? "—"}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-extrabold whitespace-nowrap tabular-nums",
                    isIn ? "text-[#069B66]" : "text-[#0A1E3F]",
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
                </td>
                <td className="px-5 py-3 text-right">
                  {canWrite && <TransactionRowActions tx={tx} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
