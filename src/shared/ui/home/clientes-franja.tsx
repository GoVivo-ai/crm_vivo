import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClientsSummary } from "@/modules/clients/application/clients-summary-action";
import { Franja, type Veredicto } from "@/shared/ui/home/franja";

const HEALTH_CHIP: Record<
  "green" | "yellow" | "red",
  { label: string; className: string }
> = {
  green: { label: "sanas", className: "bg-health-ok/10 text-health-ok" },
  yellow: {
    label: "atención",
    className: "bg-health-warn/10 text-health-warn",
  },
  red: {
    label: "riesgo",
    className: "bg-health-critical/10 text-health-critical",
  },
};

/** Franja Clientes: semáforo de salud de proyectos + accionable. */
export function ClientesFranja({ summary }: { summary: ClientsSummary }) {
  const { projectsByHealth, activeClients } = summary;
  const risky = projectsByHealth.red;
  const warning = projectsByHealth.yellow;

  const verdict: Veredicto =
    risky > 0 ? "problema" : warning > 0 ? "atencion" : "bien";

  return (
    <Franja
      dot="var(--module-clients)"
      label="Clientes · Operación"
      verdict={verdict}
      href="/clients"
      linkLabel="Abrir Clientes"
    >
      <p className="font-[family-name:var(--font-display)] text-[26px] leading-none font-extrabold tabular-nums">
        {activeClients}
        <span className="ml-1.5 text-sm font-bold text-muted-foreground">
          clientes activos
        </span>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(HEALTH_CHIP) as Array<keyof typeof HEALTH_CHIP>).map(
          (health) => {
            const count = projectsByHealth[health];
            if (count === 0) return null;
            const chip = HEALTH_CHIP[health];
            return (
              <span
                key={health}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                  chip.className,
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {count} {health === "green" ? "proyectos " : ""}
                {chip.label}
              </span>
            );
          },
        )}
        {projectsByHealth.unknown > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-bold text-muted-foreground">
            {projectsByHealth.unknown} sin datos
          </span>
        )}
      </div>

      {(risky > 0 || warning > 0) && (
        <Link
          href="/clients"
          className={cn(
            "mt-3 inline-block text-xs font-extrabold hover:underline",
            risky > 0 ? "text-health-critical" : "text-health-warn",
          )}
        >
          {risky > 0
            ? `Rescatar ${risky} proyecto${risky === 1 ? "" : "s"} en riesgo →`
            : `Revisar ${warning} proyecto${warning === 1 ? "" : "s"} en atención →`}
        </Link>
      )}
    </Franja>
  );
}
