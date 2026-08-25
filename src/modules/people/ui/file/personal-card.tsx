"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { SelectField } from "@/shared/ui/select-field";
import { Badge, FileCard, FRow, Lbl } from "./bits";
import { formatIsoDate, maskIdentification } from "./helpers";
import { SectionLomo } from "./section-lomo";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function Talla({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#F6F7F9] px-2.5 py-3">
      <Lbl>{label}</Lbl>
      <b className="font-[family-name:var(--font-display)] text-[22px] font-extrabold text-[#011640]">
        {value ?? "—"}
      </b>
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

/** Personal y dotación (§14): edad SIEMPRE derivada, documento
 * enmascarado (revelado solo write), tallas como tokens grandes. */
export function PersonalCard({
  detail,
  canWrite,
}: {
  detail: EmployeeDetail;
  canWrite: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const birth =
    detail.birthDate !== null
      ? `${formatIsoDate(detail.birthDate)}${
          detail.age !== null ? ` · ${detail.age} años` : ""
        }`
      : "—";

  return (
    <FileCard
      title="Personal y dotación"
      right={
        <>
          <span className="ml-auto" />
          <Badge tone="mut">Visible para gestión</Badge>
          {canWrite && (
            <SectionLomo
              detail={detail}
              title="Personal y dotación"
              collect={(form) => ({
                identification: str(form, "identification"),
                birthDate: str(form, "birthDate"),
                address: str(form, "address"),
                emergencyContactName: str(form, "emergencyContactName"),
                emergencyContactPhone: str(form, "emergencyContactPhone"),
                bloodType: str(form, "bloodType"),
                shirtSize: str(form, "shirtSize"),
                pantsSize: str(form, "pantsSize"),
                shoeSize: str(form, "shoeSize"),
              })}
            >
              <div className="grid grid-cols-2 gap-3">
                <F id="identification" label="Documento (CC)">
                  <Input id="identification" name="identification" defaultValue={detail.identification ?? ""} />
                </F>
                {/* La edad no se pide: se deriva de esta fecha (§14). */}
                <F id="birthDate" label="Fecha de nacimiento">
                  <Input id="birthDate" name="birthDate" type="date" defaultValue={detail.birthDate ?? ""} />
                </F>
                <F id="address" label="Dirección">
                  <Input id="address" name="address" defaultValue={detail.address ?? ""} />
                </F>
                <F id="bloodType" label="RH">
                  <SelectField
                    name="bloodType"
                    ariaLabel="Grupo sanguíneo RH"
                    defaultValue={detail.bloodType ?? ""}
                    options={BLOOD_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                </F>
                <F id="emergencyContactName" label="Contacto de emergencia">
                  <Input id="emergencyContactName" name="emergencyContactName" defaultValue={detail.emergencyContactName ?? ""} placeholder="Nombre (parentesco)" />
                </F>
                <F id="emergencyContactPhone" label="Teléfono de emergencia">
                  <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={detail.emergencyContactPhone ?? ""} />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <F id="shirtSize" label="Camisa">
                  <Input id="shirtSize" name="shirtSize" maxLength={8} defaultValue={detail.shirtSize ?? ""} />
                </F>
                <F id="pantsSize" label="Pantalón">
                  <Input id="pantsSize" name="pantsSize" maxLength={8} defaultValue={detail.pantsSize ?? ""} />
                </F>
                <F id="shoeSize" label="Calzado">
                  <Input id="shoeSize" name="shoeSize" maxLength={8} defaultValue={detail.shoeSize ?? ""} />
                </F>
              </div>
            </SectionLomo>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-7 px-5 pt-1 pb-1.5 sm:grid-cols-2">
        <FRow k="Nacimiento" v={birth} />
        <FRow
          k="Documento"
          v={
            detail.identification === null ? (
              "—"
            ) : (
              <span className="inline-flex items-center gap-2">
                {revealed
                  ? `CC ${detail.identification}`
                  : maskIdentification(detail.identification)}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => !r)}
                    className="text-[11px] font-extrabold text-[#069B66] hover:text-[#045C3D]"
                  >
                    {revealed ? "Ocultar" : "Revelar"}
                  </button>
                )}
              </span>
            )
          }
        />
        <FRow k="Dirección" v={detail.address ?? "—"} />
        <FRow
          k="RH"
          v={
            detail.bloodType ? (
              <Badge tone="bad">{detail.bloodType}</Badge>
            ) : (
              "—"
            )
          }
        />
        <FRow
          span
          k="Contacto de emergencia"
          v={
            detail.emergencyContactName
              ? [detail.emergencyContactName, detail.emergencyContactPhone]
                  .filter(Boolean)
                  .join(" · ")
              : "—"
          }
        />
      </div>
      <div className="flex flex-wrap gap-2.5 px-5 pt-2 pb-4">
        <Talla label="Camisa" value={detail.shirtSize} />
        <Talla label="Pantalón" value={detail.pantsSize} />
        <Talla label="Calzado" value={detail.shoeSize} />
        <div className="flex min-w-44 flex-[2.4] items-center px-1.5 text-[11.5px] leading-relaxed font-semibold text-[#8B99B0]">
          Tallas para dotación y regalos de la empresa.
        </div>
      </div>
    </FileCard>
  );
}
