import { cn } from "@/lib/utils";

/** Stat de cabecera (§15.1): 2–4, filtradas por rol en la página. */
export type EntityStat = {
  label: string;
  value: string;
  /** true = 16px (fechas); false = 24px (cifras protagonistas). */
  small?: boolean;
};

/**
 * Cabecera de entidad canónica (§15.1): tile 52 sobre tinta del tipo +
 * nombre 20px + badges + meta + stats a la derecha + acciones. El
 * sub-header propio del tipo (stepper) va como children.
 */
export function EntityHeader({
  tile,
  name,
  badges,
  meta,
  stats = [],
  actions,
  children,
}: {
  /** Icono o iniciales sobre la tinta del tipo. */
  tile: { content: React.ReactNode; bg: string; fg: string };
  name: string;
  badges?: React.ReactNode;
  meta?: string;
  stats?: EntityStat[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border bg-card px-6 py-5 shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="grid size-13 shrink-0 place-items-center rounded-[14px] font-[family-name:var(--font-display)] text-lg font-extrabold"
          style={{ background: tile.bg, color: tile.fg }}
        >
          {tile.content}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#011640]">
              {name}
            </h1>
            {badges}
          </div>
          {meta && (
            <p className="mt-1 truncate text-[12.5px] font-semibold text-muted-foreground">
              {meta}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-[#8B99B0]">
                {stat.label}
              </span>
              <span
                className={cn(
                  "font-[family-name:var(--font-display)] font-extrabold text-[#011640] tabular-nums",
                  stat.small ? "text-base" : "text-2xl",
                )}
              >
                {stat.value}
              </span>
            </div>
          ))}
          {actions && (
            <div className="flex items-center gap-2.5">{actions}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
