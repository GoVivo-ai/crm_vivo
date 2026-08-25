"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeDetail } from "@/modules/people/domain/types";
import { formatCurrency } from "@/shared/ui/format";
import { Badge, Lbl } from "./bits";
import { daysUntil, seniorityLabel } from "./helpers";
import { SectionLomo } from "./section-lomo";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <Lbl>{label}</Lbl>
      <span
        className={
          "font-[family-name:var(--font-display)] text-xl font-extrabold " +
          (gold ? "text-[#8C7A0A]" : "text-[#011640]")
        }
      >
        {value}
      </span>
    </div>
  );
}

/** Cabecera del expediente (§14): avatar tinta + nombre + badges +
 * meta + stats por rol. "Editar" abre el Lomo de datos básicos. */
export function FileHeader({
  detail,
  today,
  canWrite,
  checklist,
  remainingLeave,
  leaveUnit,
  salary,
}: {
  detail: EmployeeDetail;
  today: string;
  canWrite: boolean;
  checklist: { done: number; total: number };
  /** null = sin acceso al saldo. */
  remainingLeave: number | null;
  leaveUnit: string;
  /** Solo llega con people_compensation. */
  salary: { amount: number; currency: string } | null;
}) {
  const endDays =
    detail.contractEndDate !== null
      ? daysUntil(detail.contractEndDate, today)
      : null;
  const meta = [
    detail.position,
    detail.area,
    detail.email,
    detail.phone,
    detail.hiredAt
      ? `En VIVO desde ${detail.hiredAt.slice(0, 7).split("-").reverse().join("/")}`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card px-6 py-5 shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#E6F9F1] font-[family-name:var(--font-display)] text-[19px] font-extrabold text-[#069B66]">
        {initialsOf(detail.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#011640]">
            {detail.fullName}
          </h1>
          <Badge tone={detail.active ? "ok" : "mut"}>
            {detail.active ? "Activa" : "Retirada"}
          </Badge>
          {endDays !== null && endDays >= 0 && endDays <= 45 && (
            <Badge tone="warn">Contrato vence en {endDays} días</Badge>
          )}
          {endDays !== null && endDays < 0 && (
            <Badge tone="bad">Contrato vencido</Badge>
          )}
        </div>
        <p className="mt-1 truncate text-[12.5px] font-semibold text-muted-foreground">
          {meta.join(" · ") || "—"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Stat
          label="Antigüedad"
          value={detail.hiredAt ? seniorityLabel(detail.hiredAt, today) : "—"}
        />
        <Stat
          label="Vacaciones disp."
          value={
            remainingLeave !== null ? `${remainingLeave} ${leaveUnit}` : "—"
          }
        />
        <Stat
          label="Expediente"
          value={`${checklist.done} de ${checklist.total}`}
          gold={checklist.done < checklist.total}
        />
        {salary && (
          <Stat
            label="Salario base"
            value={formatCurrency(salary.amount, salary.currency)}
          />
        )}
        {canWrite && (
          <SectionLomo
            detail={detail}
            title="Datos básicos"
            triggerLabel="Editar"
            collect={(form) => ({
              fullName: (form.get("fullName") as string).trim(),
              email: (form.get("email") as string) || null,
              phone: (form.get("phone") as string) || null,
              active: form.get("active") === "on",
              annualLeaveDays: Number(form.get("annualLeaveDays") || 15),
            })}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" name="fullName" defaultValue={detail.fullName} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" defaultValue={detail.email ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={detail.phone ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="annualLeaveDays">Días de vacaciones/año</Label>
                <Input id="annualLeaveDays" name="annualLeaveDays" type="number" min={0} max={60} defaultValue={detail.annualLeaveDays} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={detail.active}
                  className="size-4 accent-[#04D98B]"
                />
                Activa en el equipo
              </label>
            </div>
          </SectionLomo>
        )}
      </div>
    </div>
  );
}
