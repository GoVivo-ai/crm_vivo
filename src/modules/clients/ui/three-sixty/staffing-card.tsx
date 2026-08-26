import Link from "next/link";
import type { StaffingAssignment } from "@/modules/profitability/domain/types";
import { initialsOf, tintFor } from "@/shared/ui/entity/tints";

/** Equipo asignado del 360 (artboard): personas + % de dedicación.
 * Solo se monta con profitability:read (la página filtra). */
export function StaffingCard({
  assignments,
}: {
  assignments: StaffingAssignment[];
}) {
  const dedicated =
    assignments.reduce((s, a) => s + a.dedicationPercent, 0) / 100;

  return (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          Equipo asignado
        </h2>
        {assignments.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-[#8B99B0]">
            {dedicated.toLocaleString("es-CO", { maximumFractionDigits: 1 })}{" "}
            personas dedicadas
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 px-5 pt-3 pb-4">
        {assignments.length === 0 ? (
          <p className="text-xs font-semibold text-muted-foreground">
            Sin asignaciones — se gestionan en{" "}
            <Link
              href="/profitability/staffing"
              className="font-extrabold text-[#069B66] hover:text-[#045C3D]"
            >
              Asignaciones →
            </Link>
          </p>
        ) : (
          assignments.map((a) => {
            const tint = tintFor(a.employeeId);
            return (
              <div key={a.id} className="flex items-center gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full font-[family-name:var(--font-display)] text-[11px] font-extrabold"
                  style={{ background: tint.bg, color: tint.fg }}
                >
                  {initialsOf(a.employeeName ?? "?")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-extrabold">
                    {a.employeeName ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-[#EEF1F6] px-2.5 py-1 text-[11px] font-extrabold text-[#5A6B85] tabular-nums">
                  {a.dedicationPercent}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
