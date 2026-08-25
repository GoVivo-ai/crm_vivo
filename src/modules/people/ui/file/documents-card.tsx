"use client";

import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { FileCard } from "./bits";
import { formatIsoDate, formatMonthYear } from "./helpers";
import { SectionLomo } from "./section-lomo";

/** Tab Documentos (§14): todo lo subido, con vencimiento si lo tiene. */
export function DocumentsCard({
  detail,
  canWrite,
  today,
}: {
  detail: EmployeeDetail;
  canWrite: boolean;
  today: string;
}) {
  return (
    <FileCard
      title="Documentos"
      right={
        canWrite && (
          <SectionLomo
            detail={detail}
            title="Subir documento"
            triggerLabel="+ Añadir documento"
            collect={(form) => ({
              documents: [
                ...detail.documents,
                {
                  name: (form.get("name") as string).trim(),
                  url: (form.get("url") as string).trim(),
                  uploadedAt: today,
                  ...((form.get("expiresAt") as string)
                    ? { expiresAt: form.get("expiresAt") as string }
                    : {}),
                },
              ],
            })}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Documento</Label>
              <Input id="name" name="name" required placeholder="Contrato firmado" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">Enlace al archivo (Drive, etc.)</Label>
              <Input id="url" name="url" type="url" required placeholder="https://…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiresAt">Vence (opcional)</Label>
              <Input id="expiresAt" name="expiresAt" type="date" />
            </div>
          </SectionLomo>
        )
      }
    >
      {detail.documents.length === 0 ? (
        <p className="px-5 pt-2.5 pb-4 text-xs font-semibold text-muted-foreground">
          Sin documentos aún.
          {canWrite && " Empieza por la checklist de completitud."}
        </p>
      ) : (
        <ul className="flex flex-col px-5 pt-2 pb-4">
          {detail.documents.map((doc) => (
            <li
              key={`${doc.name}-${doc.url}`}
              className="flex items-center gap-2.5 border-b border-[#EDF0F5] py-2.5 last:border-b-0"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-[12.5px] font-bold hover:text-[#069B66]"
              >
                {doc.name}
              </a>
              {doc.uploadedAt && (
                <span className="text-[11px] font-semibold text-[#8B99B0]">
                  {formatMonthYear(doc.uploadedAt)}
                </span>
              )}
              {doc.expiresAt && (
                <span className="text-[11px] font-semibold text-[#8B99B0]">
                  · vence {formatIsoDate(doc.expiresAt)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </FileCard>
  );
}
