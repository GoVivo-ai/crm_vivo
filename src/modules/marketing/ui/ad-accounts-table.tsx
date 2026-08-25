"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setAdAccountLink } from "@/modules/marketing/application/marketing-actions";
import type { AdAccountView } from "@/modules/marketing/domain/types";
import { PLATFORM_LABELS } from "@/modules/marketing/ui/metrics-tables";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type Option = { id: string; name: string };

type AdAccountsTableProps = {
  adAccounts: AdAccountView[];
  clients: Option[];
  /** Roles marketing:ro ven la vinculación en solo-lectura. */
  canWrite: boolean;
};

/** Vinculación cuenta publicitaria ↔ cliente CRM; sin vincular = pendiente. */
export function AdAccountsTable({
  adAccounts,
  clients,
  canWrite,
}: AdAccountsTableProps) {
  const { submit, pending } = useActionSubmit<{ adAccountId: string }>();

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuenta publicitaria</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cliente vinculado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adAccounts.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell>
                <p className="text-sm font-medium">{ad.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {ad.externalAccountId}
                </p>
              </TableCell>
              <TableCell>{PLATFORM_LABELS[ad.platform]}</TableCell>
              <TableCell className="font-mono text-xs">
                {ad.accountCurrency}
              </TableCell>
              <TableCell>
                {ad.accountId === null ? (
                  <Badge
                    variant="outline"
                    className="border-health-warn/30 bg-health-warn/10 text-health-warn"
                  >
                    Sin vincular
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-health-ok/30 bg-health-ok/10 text-health-ok"
                  >
                    Vinculada
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {!canWrite ? (
                  <span className="text-sm">
                    {ad.linkedAccountName ?? "—"}
                  </span>
                ) : (
                <NativeSelect
                  aria-label={`Cliente de ${ad.name}`}
                  value={ad.accountId ?? ""}
                  disabled={pending}
                  className="w-52"
                  onChange={(e) =>
                    submit(
                      () =>
                        setAdAccountLink({
                          adAccountId: ad.id,
                          accountId: e.target.value || null,
                        }),
                      {
                        successMessage: e.target.value
                          ? "Cuenta vinculada"
                          : "Cuenta desvinculada",
                      },
                    )
                  }
                >
                  <option value="">Sin vincular</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
