import { Search } from "lucide-react";
import type { Route } from "next";
import { Input } from "@/components/ui/input";
import {
  IdentityCell,
  LIST_TH,
  ListChips,
  ListFooter,
  RowChevron,
} from "@/shared/ui/entity/list-bits";
import { listAccounts } from "@/modules/crm/application/accounts-actions";
import { AccountForm } from "@/modules/crm/ui/account-form";
import { AccountStatusBadge } from "@/modules/crm/ui/labels";
import { ActionError } from "@/shared/ui/action-error";
import { EmptyState } from "@/shared/ui/empty-state";

export default async function AccountsPage({
  searchParams,
}: PageProps<"/crm/accounts">) {
  const params = await searchParams;
  const search =
    typeof params.q === "string" && params.q !== "" ? params.q : null;
  const status =
    typeof params.status === "string" && params.status !== ""
      ? params.status
      : null;

  const result = await listAccounts({ search });
  if (!result.ok) return <ActionError message={result.error} />;
  const all = result.data;
  const counts = {
    prospect: all.filter((a) => a.status === "prospect").length,
    active: all.filter((a) => a.status === "active").length,
    paused: all.filter((a) => a.status === "paused").length,
    churned: all.filter((a) => a.status === "churned").length,
  };
  const accounts = status ? all.filter((a) => a.status === status) : all;
  // §15.2: una columna sin datos en toda la página se elimina.
  const hasWebsite = accounts.some((a) => a.website !== null);
  const qs = search ? `&q=${encodeURIComponent(search)}` : "";
  const chips = [
    { href: `/crm/accounts?${qs.slice(1)}`, label: `Todas ${all.length}`, active: status === null },
    { href: `/crm/accounts?status=prospect${qs}`, label: `Prospectos ${counts.prospect}`, active: status === "prospect", cls: "bg-[#E8F0FB] text-[#1E5FBF]" },
    { href: `/crm/accounts?status=active${qs}`, label: `Activas ${counts.active}`, active: status === "active", cls: "bg-[#E6F9F1] text-[#069B66]" },
    { href: `/crm/accounts?status=paused${qs}`, label: `En pausa ${counts.paused}`, active: status === "paused", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
    { href: `/crm/accounts?status=churned${qs}`, label: `Perdidas ${counts.churned}`, active: status === "churned", cls: "bg-[#EEF1F6] text-[#5A6B85]" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListChips chips={chips} />
        <div className="flex items-center gap-2">
          <form className="relative" action="/crm/accounts">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar cuenta…"
              defaultValue={search ?? ""}
              className="w-56 pl-8"
            />
          </form>
          <AccountForm triggerLabel="Nueva cuenta" />
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title={search ? `Sin resultados para "${search}"` : "Aún no hay cuentas"}
          hint={
            search
              ? "Prueba con otro nombre o revisa la ortografía."
              : "Las cuentas son las empresas con las que trabajas: de prospecto a cliente activo."
          }
          action={
            search ? undefined : (
              <AccountForm triggerLabel="Crear la primera cuenta" />
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b">
                <th className={LIST_TH}>Cuenta</th>
                <th className={LIST_TH}>Estado</th>
                <th className={LIST_TH}>Industria</th>
                {hasWebsite && <th className={LIST_TH}>Sitio web</th>}
                <th className={LIST_TH} aria-hidden />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="relative border-b border-[#EDF0F5] transition-colors last:border-b-0 hover:bg-[#F6F7F9]"
                >
                  <td className="px-5 py-3">
                    <IdentityCell
                      id={account.id}
                      name={account.name}
                      sub={account.nit ? `NIT ${account.nit}` : "Sin NIT"}
                      href={`/crm/accounts/${account.id}` as Route}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <AccountStatusBadge status={account.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {account.industry ?? "—"}
                  </td>
                  {hasWebsite && (
                    <td className="px-5 py-3 text-muted-foreground">
                      {account.website ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right">
                    <RowChevron />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListFooter shown={accounts.length} total={all.length} />
        </div>
      )}
    </div>
  );
}
