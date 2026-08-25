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
import { Combobox } from "@/shared/ui/combobox";
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
                <div className="w-56">
                  <Combobox
                    ariaLabel={`Cliente de ${ad.name}`}
                    options={[{ id: "__none", name: "— Sin vincular —" }, ...clients]}
                    value={ad.accountId ?? "__none"}
                    onValueChange={(id) => {
                      if (pending) return;
                      const accountId = id === "__none" || id === null ? null : id;
                      submit(
                        () => setAdAccountLink({ adAccountId: ad.id, accountId }),
                        {
                          successMessage: accountId
                            ? `${ad.name} vinculada`
                            : `${ad.name} desvinculada`,
                        },
                      );
                    }}
                    placeholder="Buscar cliente…"
                  />
                </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
