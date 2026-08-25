import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { BankAccountView } from "@/modules/treasury/domain/types";
import { formatAccountingMoney, formatCurrency } from "@/shared/ui/format";

const TYPE_LABELS: Record<string, string> = {
  bank: "Banco",
  cash: "Caja",
  "credit-card": "Tarjeta de crédito",
};

/** Cuentas bancarias con su saldo propio y el normalizado a COP. */
export function BankAccountsTable({
  accounts,
}: {
  accounts: BankAccountView[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cuenta</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">En COP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const inactive = account.status !== "active";
          return (
            <TableRow
              key={account.id}
              className={cn(inactive && "opacity-50")}
            >
              <TableCell>
                <p className="text-sm font-medium">{account.name}</p>
                {account.number && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {account.number}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {TYPE_LABELS[account.type ?? ""] ?? (account.type || "—")}
                {inactive && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    · inactiva
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {account.balance !== null
                  ? formatCurrency(account.balance, account.currencyCode)
                  : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono text-xs",
                  (account.balanceCop ?? 0) < 0 && "text-health-critical",
                )}
              >
                {account.balanceCop !== null
                  ? formatAccountingMoney(account.balanceCop)
                  : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
