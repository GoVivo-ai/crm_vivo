import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { getClientsHealthList } from "@/modules/clients/application/clients-health-action";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";
import { initialsOf, tintFor } from "@/shared/ui/entity/tints";

const HEALTH = {
  green: { label: "Sana", cls: "bg-[#E6F9F1] text-[#069B66]" },
  yellow: { label: "Atención", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
  red: { label: "En riesgo", cls: "bg-[#FAEAEA] text-[#C93A3A]" },
} as const;

const TH =
  "px-5 py-2.5 text-left text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]";

/** Lista de Clientes al sistema §15.2: celda identidad, badges de
 * tinta, fila entera al 360, chips con conteos. */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/clients">) {
  const params = await searchParams;
  const status =
    typeof params.status === "string" && params.status !== ""
      ? params.status
      : null;

  const [result, healthResult] = await Promise.all([
    listAccounts(),
    getClientsHealthList(),
  ]);
  if (!result.ok) return <ActionError message={result.error} />;
  const health = new Map(
    (healthResult.ok ? healthResult.data : []).map((c) => [c.accountId, c]),
  );

  const all = result.data.filter((a) => a.status !== "prospect");
  const counts = {
    active: all.filter((a) => a.status === "active").length,
    paused: all.filter((a) => a.status === "paused").length,
    churned: all.filter((a) => a.status === "churned").length,
  };
  const clients = status ? all.filter((a) => a.status === status) : all;

  const chips = [
    { href: "/clients", label: `Todos ${all.length}`, active: status === null, cls: "bg-[#E7EBF3] text-[#011640]" },
    { href: "/clients?status=active", label: `Activos ${counts.active}`, active: status === "active", cls: "bg-[#E6F9F1] text-[#069B66]" },
    { href: "/clients?status=paused", label: `En pausa ${counts.paused}`, active: status === "paused", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
    { href: "/clients?status=churned", label: `Perdidos ${counts.churned}`, active: status === "churned", cls: "bg-[#EEF1F6] text-[#5A6B85]" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href as Route}
            aria-current={chip.active ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-[11.5px] font-extrabold transition-colors",
              chip.active
                ? chip.cls
                : "bg-[#EEF1F6] text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </nav>

      {clients.length === 0 ? (
        <EmptyState
          title={status ? "Sin clientes en este estado" : "Aún no hay clientes"}
          hint={
            status
              ? "Cambia de chip para ver otros estados."
              : "Cuando un negocio se marque ganado en el pipeline, la cuenta aparecerá aquí con sus servicios, proyectos y MRR."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b">
                <th className={TH}>Cliente</th>
                <th className={TH}>Salud</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Industria</th>
                <th className={TH} aria-hidden />
              </tr>
            </thead>
            <tbody>
              {clients.map((account) => {
                const tint = tintFor(account.id);
                const h = health.get(account.id) ?? null;
                return (
                  <tr
                    key={account.id}
                    className="relative border-b border-[#EDF0F5] transition-colors last:border-b-0 hover:bg-[#F6F7F9]"
                  >
                    <td className="px-5 py-3">
                      {/* La fila entera navega al 360 (§15.2). */}
                      <Link
                        href={`/clients/${account.id}` as Route}
                        className="absolute inset-0"
                        aria-label={`Abrir ${account.name}`}
                      />
                      <span className="flex items-center gap-3">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-[9px] font-[family-name:var(--font-display)] text-[11px] font-extrabold"
                          style={{ background: tint.bg, color: tint.fg }}
                        >
                          {initialsOf(account.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-extrabold text-[#011640]">
                            {account.name}
                          </span>
                          <span className="block truncate text-[11.5px] text-[#8B99B0]">
                            {account.nit ? `NIT ${account.nit}` : "Sin NIT"}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {h ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${HEALTH[h.bucket].cls}`}
                        >
                          {HEALTH[h.bucket].label}
                        </span>
                      ) : (
                        <span className="text-[#8B99B0]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <AccountStatusBadge status={account.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {account.industry ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="ml-auto size-4 text-[#8B99B0]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t px-5 py-2.5 text-[11.5px] font-semibold text-[#8B99B0]">
            Mostrando {clients.length} de {all.length}
          </p>
        </div>
      )}
    </div>
  );
}
