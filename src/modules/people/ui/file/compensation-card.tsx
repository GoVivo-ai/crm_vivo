"use client";

import { BadgeDollarSign, Lock } from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CaptureDialogBar,
  CaptureDialogBody,
  CaptureDialogContent,
  CaptureDialogFooter,
  CaptureLomo,
} from "@/shared/ui/capture-dialog";
import { DiscardGuardDialog } from "@/shared/ui/discard-guard";
import { setEmployeeBaseSalary } from "@/modules/people/application/team-actions";
import type { EmployeeCompensation } from "@/modules/people/domain/types";
import { formatCurrency } from "@/shared/ui/format";
import { Segmented } from "@/shared/ui/segmented";
import { SourceBadge } from "@/shared/ui/source-badge";
import { useActionSubmit } from "@/shared/ui/use-action-submit";
import { useDirtyGuard } from "@/shared/ui/use-dirty-guard";
import { Badge, FileCard, Lbl } from "./bits";
import { formatIsoDate } from "./helpers";

/** Card Compensación (§14): candado visible; salario 26px tabular;
 * últimos pagos. Solo se monta con people_compensation (o self, RO). */
export function CompensationCard({
  compensation,
  canWriteCompensation,
}: {
  compensation: EmployeeCompensation;
  canWriteCompensation: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(compensation.baseSalaryCurrency);
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const formRef = useRef<HTMLFormElement>(null);
  const guard = useDirtyGuard({ open, setOpen, formRef, extraState: { currency } });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        setEmployeeBaseSalary({
          employeeId: compensation.employeeId,
          baseSalary:
            (form.get("baseSalary") as string) === ""
              ? null
              : Number(form.get("baseSalary")),
          currency,
        }),
      {
        successMessage: "Salario base actualizado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  const recent = compensation.payments.slice(0, 4);

  return (
    <FileCard
      title="Compensación"
      right={
        <>
          <span className="ml-auto" />
          <Badge tone="info">
            <Lock className="size-[11px]" /> Solo finanzas y gestión
          </Badge>
          {canWriteCompensation && (
            <>
              <Dialog open={open} onOpenChange={guard.guardedOnOpenChange}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
                    />
                  }
                >
                  Editar sección →
                </DialogTrigger>
                <CaptureDialogContent>
                  <CaptureLomo
                    icon={BadgeDollarSign}
                    module="Equipo"
                    title="Salario base"
                    tone="team"
                    context={{ entity: compensation.fullName }}
                  />
                  <div className="flex min-w-0 flex-col">
                    <CaptureDialogBar subtitle={`Expediente · ${compensation.fullName}`} />
                    <form ref={formRef} onSubmit={onSubmit}>
                      <CaptureDialogBody>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="baseSalary">
                            Salario base mensual
                          </Label>
                          <Input
                            id="baseSalary"
                            name="baseSalary"
                            type="number"
                            min={0}
                            defaultValue={compensation.baseSalary ?? ""}
                          />
                          {fieldErrors.baseSalary && (
                            <p className="text-xs text-destructive">
                              {fieldErrors.baseSalary.join(" ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Moneda</Label>
                          <Segmented
                            value={currency}
                            onChange={setCurrency}
                            options={[
                              { value: "COP", label: "COP" },
                              { value: "USD", label: "USD" },
                            ]}
                            ariaLabel="Moneda del salario"
                          />
                        </div>
                      </CaptureDialogBody>
                      <CaptureDialogFooter
                        submitLabel="Guardar salario"
                        pending={pending}
                      />
                    </form>
                  </div>
                </CaptureDialogContent>
              </Dialog>
              <DiscardGuardDialog
                open={guard.discardOpen}
                onOpenChange={guard.setDiscardOpen}
                onDiscard={guard.discard}
              />
            </>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-7 px-5 pt-3 pb-1">
        <div>
          <Lbl>Salario base</Lbl>
          <div className="mt-0.5 font-[family-name:var(--font-display)] text-[26px] font-extrabold text-[#011640] tabular-nums">
            {compensation.baseSalary !== null ? (
              <>
                {formatCurrency(
                  compensation.baseSalary,
                  compensation.baseSalaryCurrency,
                )}
                <span className="text-[13px] font-bold text-muted-foreground">
                  {" "}
                  {compensation.baseSalaryCurrency}/mes
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>
      {recent.length > 0 ? (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-2 text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]">Periodo</th>
                <th className="px-5 py-2 text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]">Pagado</th>
                <th className="px-5 py-2 text-right text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]">Neto</th>
                <th className="px-5 py-2 text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-[#EDF0F5] last:border-b-0">
                  <td className="px-5 py-2.5 font-bold">{p.period}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">
                    {formatIsoDate(p.paidAt)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-extrabold tabular-nums">
                    {formatCurrency(p.amount, p.currencyCode)}
                  </td>
                  <td className="px-5 py-2.5">
                    <SourceBadge source="manual" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 pt-1 pb-4 text-xs font-semibold text-muted-foreground">
          Sin pagos registrados aún.
        </p>
      )}
      {recent.length > 0 && (
        <div className="px-5 pt-2 pb-3.5">
          <Link
            href="/people"
            className="text-xs font-extrabold text-[#069B66] hover:text-[#045C3D]"
          >
            Ver historial de nómina →
          </Link>
        </div>
      )}
    </FileCard>
  );
}
