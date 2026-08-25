"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { NativeSelect } from "@/shared/ui/native-select";
import { FileCard, FRow, Lbl } from "./bits";
import {
  CONTRACT_TYPE_LABELS,
  daysUntil,
  formatIsoDate,
} from "./helpers";
import { SectionLomo } from "./section-lomo";

function Afi({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[10px] bg-[#F6F7F9] px-3 py-2.5">
      <Lbl>{label}</Lbl>
      <b className="truncate text-[12.5px] font-extrabold">{value ?? "—"}</b>
    </div>
  );
}

function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

const str = (form: FormData, k: string) => (form.get(k) as string) || null;

/** Card Contractual (§14): pares 2 col + chips de afiliación. */
export function ContractualCard({
  detail,
  today,
  canWrite,
}: {
  detail: EmployeeDetail;
  today: string;
  canWrite: boolean;
}) {
  const endDays =
    detail.contractEndDate !== null
      ? daysUntil(detail.contractEndDate, today)
      : null;

  return (
    <FileCard
      title="Contractual"
      right={
        canWrite && (
          <SectionLomo
            detail={detail}
            title="Contractual"
            collect={(form) => ({
              contractType:
                (str(form, "contractType") as EmployeeDetail["contractType"]) ??
                null,
              workSchedule: str(form, "workSchedule"),
              hiredAt: str(form, "hiredAt"),
              contractEndDate: str(form, "contractEndDate"),
              position: str(form, "position"),
              area: str(form, "area"),
              eps: str(form, "eps"),
              afp: str(form, "afp"),
              arl: str(form, "arl"),
              cajaCompensacion: str(form, "cajaCompensacion"),
            })}
          >
            <div className="grid grid-cols-2 gap-3">
              <F id="contractType" label="Tipo de contrato">
                <NativeSelect
                  id="contractType"
                  name="contractType"
                  defaultValue={detail.contractType ?? ""}
                >
                  <option value="">—</option>
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </NativeSelect>
              </F>
              <F id="workSchedule" label="Jornada">
                <Input id="workSchedule" name="workSchedule" defaultValue={detail.workSchedule ?? ""} placeholder="Tiempo completo" />
              </F>
              <F id="hiredAt" label="Inicio">
                <Input id="hiredAt" name="hiredAt" type="date" defaultValue={detail.hiredAt ?? ""} />
              </F>
              <F id="contractEndDate" label="Fin">
                <Input id="contractEndDate" name="contractEndDate" type="date" defaultValue={detail.contractEndDate ?? ""} />
              </F>
              <F id="position" label="Cargo">
                <Input id="position" name="position" defaultValue={detail.position ?? ""} />
              </F>
              <F id="area" label="Área">
                <Input id="area" name="area" defaultValue={detail.area ?? ""} />
              </F>
              <F id="eps" label="EPS">
                <Input id="eps" name="eps" defaultValue={detail.eps ?? ""} />
              </F>
              <F id="afp" label="Pensión (AFP)">
                <Input id="afp" name="afp" defaultValue={detail.afp ?? ""} />
              </F>
              <F id="arl" label="ARL · nivel de riesgo">
                <Input id="arl" name="arl" defaultValue={detail.arl ?? ""} placeholder="Sura · riesgo I" />
              </F>
              <F id="cajaCompensacion" label="Caja de compensación">
                <Input id="cajaCompensacion" name="cajaCompensacion" defaultValue={detail.cajaCompensacion ?? ""} />
              </F>
            </div>
          </SectionLomo>
        )
      }
    >
      <div className="grid grid-cols-1 gap-x-7 px-5 pt-1 pb-1.5 sm:grid-cols-2">
        <FRow
          k="Tipo de contrato"
          v={detail.contractType ? CONTRACT_TYPE_LABELS[detail.contractType] : "—"}
        />
        <FRow k="Jornada" v={detail.workSchedule ?? "—"} />
        <FRow k="Inicio" v={detail.hiredAt ? formatIsoDate(detail.hiredAt) : "—"} />
        <FRow
          k="Fin"
          className={
            endDays !== null && endDays <= 45 ? "text-[#8C7A0A]" : undefined
          }
          v={
            detail.contractEndDate
              ? `${formatIsoDate(detail.contractEndDate)}${
                  endDays !== null && endDays >= 0 && endDays <= 45
                    ? ` · en ${endDays} días`
                    : endDays !== null && endDays < 0
                      ? " · vencido"
                      : ""
                }`
              : "—"
          }
        />
        <FRow k="Cargo" v={detail.position ?? "—"} />
        <FRow k="Área" v={detail.area ?? "—"} />
      </div>
      {detail.eps || detail.afp || detail.arl || detail.cajaCompensacion ? (
        <div className="grid grid-cols-2 gap-2.5 px-5 pt-2 pb-4 lg:grid-cols-4">
          <Afi label="EPS" value={detail.eps} />
          <Afi label="Pensión (AFP)" value={detail.afp} />
          <Afi label="ARL" value={detail.arl} />
          <Afi label="Caja compens." value={detail.cajaCompensacion} />
        </div>
      ) : (
        <p className="px-5 pt-2 pb-4 text-xs font-semibold text-muted-foreground">
          Sin afiliaciones registradas.
          {canWrite && " Completa la sección con el enlace de arriba."}
        </p>
      )}
    </FileCard>
  );
}
