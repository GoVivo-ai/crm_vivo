"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/shared/ui/combobox";

type Option = { id: string; name: string };

type DashboardFiltersProps = {
  clients: Option[];
  accountId: string | null;
  from: string | null;
  to: string | null;
};

/** Filtros del dashboard: cliente por Combobox (lista dinámica, §12.3);
 * el rango viaja por GET → searchParams. */
export function DashboardFilters({
  clients,
  accountId,
  from,
  to,
}: DashboardFiltersProps) {
  const router = useRouter();

  function pushAccount(id: string | null) {
    const params = new URLSearchParams();
    if (id && id !== "__all") params.set("account", id);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/marketing?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Cliente
        <div className="w-52">
          <Combobox
            ariaLabel="Filtrar por cliente"
            options={[{ id: "__all", name: "Todos los clientes" }, ...clients]}
            value={accountId ?? "__all"}
            onValueChange={pushAccount}
            placeholder="Buscar cliente…"
          />
        </div>
      </label>
      <form
        action="/marketing"
        className="flex items-end gap-2"
        aria-label="Rango de fechas"
      >
        {accountId && <input type="hidden" name="account" value={accountId} />}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <Input type="date" name="from" defaultValue={from ?? ""} className="w-36" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <Input type="date" name="to" defaultValue={to ?? ""} className="w-36" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Aplicar
        </Button>
      </form>
    </div>
  );
}
