"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { Badge, FileCard } from "./bits";
import { SectionLomo } from "./section-lomo";

/** Notas internas (§14): SOLO gestión (write) — el caso self recibe
 * notes: null del server y esta card ni se monta. */
export function NotesCard({ detail }: { detail: EmployeeDetail }) {
  return (
    <FileCard
      title="Notas internas"
      right={
        <>
          <span className="ml-auto" />
          <Badge tone="mut">Solo gestión</Badge>
          <SectionLomo
            detail={detail}
            title="Notas internas"
            collect={(form) => ({
              notes: (form.get("notes") as string).trim() || null,
            })}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Seguimiento</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={detail.notes ?? ""}
                placeholder="Renovación, acuerdos, próximos 1:1…"
              />
            </div>
          </SectionLomo>
        </>
      }
    >
      <p className="px-5 pt-2.5 pb-4 text-[12.5px] leading-relaxed font-semibold text-muted-foreground whitespace-pre-wrap">
        {detail.notes ?? "Sin notas de seguimiento."}
      </p>
    </FileCard>
  );
}
