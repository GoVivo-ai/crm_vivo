import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  SpendByCostCenter,
  SpendByProvider,
} from "@/modules/purchases/domain/types";
import { formatMoney } from "@/shared/ui/format";

/** Gasto del periodo por centro de costo (texto libre). */
export function CostCenterTable({ rows }: { rows: SpendByCostCenter[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Centro de costo</TableHead>
          <TableHead className="text-right">Registros</TableHead>
          <TableHead className="text-right">Gasto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.costCenter ?? "__none"}>
            <TableCell
              className={
                row.costCenter === null
                  ? "text-health-warn"
                  : "font-medium"
              }
            >
              {row.costCenter ?? "Sin asignar"}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {row.expenses}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatMoney(row.totalCop)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Top proveedores del periodo por gasto. */
export function ProviderTable({ rows }: { rows: SpendByProvider[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proveedor</TableHead>
          <TableHead className="text-right">Registros</TableHead>
          <TableHead className="text-right">Gasto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.providerName}>
            <TableCell className="max-w-72 truncate font-medium">
              {row.providerName ?? "Sin proveedor"}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {row.expenses}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {formatMoney(row.totalCop)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
