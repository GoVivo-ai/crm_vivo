import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";

type Option = { id: string; name: string };

type DashboardFiltersProps = {
  clients: Option[];
  accountId: string | null;
  from: string | null;
  to: string | null;
};

/** Filtros por GET → searchParams: cliente + rango de fechas. */
export function DashboardFilters({
  clients,
  accountId,
  from,
  to,
}: DashboardFiltersProps) {
  return (
    <form
      action="/marketing"
      className="flex flex-wrap items-end gap-2"
      aria-label="Filtros del dashboard"
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Cliente
        <NativeSelect
          name="account"
          defaultValue={accountId ?? ""}
          className="w-48"
        >
          <option value="">Todos</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </label>
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
  );
}
