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
import { BankAccountRowActions } from "@/modules/treasury/ui/bank-account-row-actions";
import { formatAccountingMoney, formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const TYPE_LABELS: Record<string, string> = {
  bank: "Banco",
  cash: "Caja",
  "credit-card": "Tarjeta de crédito",
};

/** Cuentas con saldo propio y consolidado; las manuales se editan aquí. */
export function BankAccountsTable({
  accounts,
  canWrite,
}: {
  accounts: BankAccountView[];
  /** treasury:write — sin él no se renderiza editar. */
  canWrite: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cuenta</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">En COP</TableHead>
          <TableHead>Fuente</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow
            key={account.id}
            className={cn(!account.isActive && "opacity-50")}
          >
            <TableCell>
              <p className="text-sm font-medium">{account.name}</p>
              {account.balanceUpdatedAt && (
                <p className="text-xs text-muted-foreground">
                  saldo al{" "}
                  {account.balanceUpdatedAt.toISOString().slice(0, 10)}
                </p>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {TYPE_LABELS[account.type ?? ""] ?? (account.type || "—")}
              {!account.isActive && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  · inactiva
                </span>
              )}
            </TableCell>
            <TableCell className="text-right text-xs font-bold tabular-nums">
              {formatCurrency(account.balance, account.currencyCode)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right text-xs font-bold tabular-nums",
                account.balanceCop < 0 && "text-health-critical",
              )}
            >
              {formatAccountingMoney(account.balanceCop)}
            </TableCell>
            <TableCell>
              <SourceBadge source={account.source} />
            </TableCell>
            <TableCell className="text-right">
              {canWrite && account.source === "manual" && (
                <BankAccountRowActions account={account} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
