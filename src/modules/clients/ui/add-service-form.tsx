"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addServiceToAccount } from "@/modules/clients/application/services-actions";
import type { AccountService, Service } from "@/modules/clients/domain/types";
import { FieldError } from "@/shared/ui/field-error";
import { NativeSelect } from "@/shared/ui/native-select";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type AddServiceFormProps = {
  accountId: string;
  catalog: Service[];
  today: string; // YYYY-MM-DD
};

/** Contratar un servicio del catálogo para una cuenta. */
export function AddServiceForm({
  accountId,
  catalog,
  today,
}: AddServiceFormProps) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(catalog[0]?.id ?? "");
  const { submit, pending, fieldErrors } = useActionSubmit<AccountService>();

  const selected = catalog.find((s) => s.id === serviceId);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      () =>
        addServiceToAccount({
          accountId,
          serviceId,
          monthlyFee: Number(form.get("monthlyFee")),
          startDate: form.get("startDate"),
        }),
      {
        successMessage: "Servicio contratado",
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Contratar servicio
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contratar servicio</DialogTitle>
        </DialogHeader>
        {catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            El catálogo está vacío. Crea primero un servicio en Clientes →
            Servicios.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceId">Servicio</Label>
              <NativeSelect
                id="serviceId"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                {catalog.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError errors={fieldErrors.serviceId} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monthlyFee">Fee mensual (COP)</Label>
                <Input
                  id="monthlyFee"
                  name="monthlyFee"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  key={serviceId}
                  defaultValue={selected?.defaultMonthlyFee ?? ""}
                  required
                />
                <FieldError errors={fieldErrors.monthlyFee} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate">Desde</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={today}
                  required
                />
                <FieldError errors={fieldErrors.startDate} />
              </div>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Contratando…" : "Contratar"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
