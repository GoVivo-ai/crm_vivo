"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { Badge, FileCard } from "./bits";
import { computeChecklist } from "./helpers";
import { SectionLomo } from "./section-lomo";

/** Sube un documento del checklist: nombre precargado con el ítem
 * canónico + URL (los archivos viven fuera; aquí se referencia). */
function UploadDoc({
  detail,
  presetName,
  label = "Subir →",
}: {
  detail: EmployeeDetail;
  presetName: string;
  label?: string;
}) {
  return (
    <SectionLomo
      detail={detail}
      title="Subir documento"
      triggerLabel={label}
      collect={(form) => ({
        documents: [
          ...detail.documents,
          {
            name: (form.get("name") as string).trim(),
            url: (form.get("url") as string).trim(),
            ...((form.get("expiresAt") as string)
              ? { expiresAt: form.get("expiresAt") as string }
              : {}),
          },
        ],
      })}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Documento</Label>
        <Input id="name" name="name" defaultValue={presetName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">Enlace al archivo (Drive, etc.)</Label>
        <Input id="url" name="url" type="url" placeholder="https://…" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expiresAt">Vence (opcional)</Label>
        <Input id="expiresAt" name="expiresAt" type="date" />
      </div>
    </SectionLomo>
  );
}

/** Completitud del expediente (§14): barra gradiente firma + checklist
 * canónica. El "N de M" alimenta el stat de cabecera. */
export function ChecklistCard({
  detail,
  canWrite,
}: {
  detail: EmployeeDetail;
  canWrite: boolean;
}) {
  const { items, done, total } = computeChecklist(detail.documents);
  const complete = done === total;

  return (
    <FileCard
      title="Completitud del expediente"
      className={cn(!complete && "border-[rgba(140,122,10,0.35)]")}
      right={
        <>
          <span className="ml-auto" />
          <Badge tone={complete ? "ok" : "warn"}>
            {done} de {total}
          </Badge>
        </>
      }
    >
      <div className="px-5 pt-2.5">
        <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F6]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#04D98B] to-[#F2E205]"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col px-5 pt-2 pb-4">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2.5 border-b border-[#EDF0F5] py-2.5 last:border-b-0"
          >
            {item.doc ? (
              <Check className="size-3.5 shrink-0 text-[#069B66]" strokeWidth={2.6} />
            ) : (
              <span className="size-3.5 shrink-0 rounded-full border-[1.5px] border-dashed border-[#C6CFDD]" />
            )}
            <span
              className={cn(
                "flex-1 text-[12.5px] font-bold",
                item.doc === null && "text-[#8C7A0A]",
              )}
            >
              {item.doc ? (
                <a
                  href={item.doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#069B66]"
                >
                  {item.label}
                </a>
              ) : (
                item.label
              )}
            </span>
            {item.doc === null && canWrite && (
              <UploadDoc detail={detail} presetName={item.label} />
            )}
          </li>
        ))}
      </ul>
      {done === 0 && (
        <p className="px-5 pb-4 -mt-1 text-xs font-semibold text-muted-foreground">
          Expediente recién creado: esta lista es la guía de onboarding.
        </p>
      )}
    </FileCard>
  );
}
