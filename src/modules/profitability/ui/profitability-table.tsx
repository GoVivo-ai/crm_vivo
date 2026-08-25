import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AccountProfitability } from "@/modules/profitability/domain/types";
import { formatAccountingMoney, formatMoney } from "@/shared/ui/format";

/**
 * Ranking de margen por cliente con el desglose por componente. La pauta
 * gestionada es informativa y NO está restada del margen.
 */
export function ProfitabilityTable({
  accounts,
}: {
  accounts: AccountProfitability[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-right">Ingresos</TableHead>
          <TableHead className="text-right">Costo de personal</TableHead>
          <TableHead className="text-right">Margen</TableHead>
          <TableHead className="text-right">Pauta gestionada</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.accountId}>
            <TableCell className="max-w-56 truncate text-sm font-medium">
              {account.accountName}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatMoney(account.revenueCop)}
            </TableCell>
            <TableCell className="text-right">
              <p className="font-mono text-xs">
                {formatMoney(account.staffingCostCop)}
              </p>
              <p className="text-xs text-muted-foreground">
                {account.assignedDedicationPercent}% dedicación
              </p>
            </TableCell>
            <TableCell className="text-right">
              <p
                className={cn(
                  "font-mono text-sm font-medium",
                  account.marginCop < 0 && "text-health-critical",
                )}
              >
                {formatAccountingMoney(account.marginCop)}
              </p>
              <p
                className={cn(
                  "text-xs",
                  account.marginPercent === null
                    ? "text-muted-foreground"
                    : account.marginPercent < 0
                      ? "text-health-critical"
                      : "text-health-ok",
                )}
              >
                {account.marginPercent === null
                  ? "— sin facturación"
                  : `${account.marginPercent.toFixed(1)}%`}
              </p>
            </TableCell>
            <TableCell className="text-right font-mono text-xs text-muted-foreground">
              {account.adSpendCop > 0 ? formatMoney(account.adSpendCop) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
