"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearIntegrationCredentials,
  setIntegrationCredentials,
  testIntegrationConnection,
} from "@/modules/settings/application/integration-credentials-actions";
import { runSyncNow } from "@/modules/settings/application/run-sync-now-action";
import type { IntegrationStatus } from "@/modules/settings/domain/types";
import { IntegrationStatusLine } from "@/modules/settings/ui/integration-status-line";
import type { IntegrationMeta } from "@/modules/settings/ui/integrations-catalog";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type IntegrationCardProps = {
  meta: IntegrationMeta;
  status: IntegrationStatus;
};

export function IntegrationCard({ meta, status }: IntegrationCardProps) {
  // Los inputs NUNCA se pre-llenan con secretos: el hint va en el estado.
  const [values, setValues] = useState<Record<string, string>>({});
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();

  const typedCount = meta.fields.filter((f) => values[f.name]?.trim()).length;
  const allTyped = typedCount === meta.fields.length;

  function typedCredentials(): Record<string, string> | null {
    if (typedCount === 0) return null; // probar las guardadas
    if (!allTyped) {
      toast.error("Completa todos los campos para probar esas credenciales");
      return null;
    }
    return Object.fromEntries(
      meta.fields.map((f) => [f.name, values[f.name].trim()]),
    );
  }

  function onTest() {
    const credentials = typedCount > 0 ? typedCredentials() : null;
    if (typedCount > 0 && credentials === null) return;
    submit(
      () =>
        testIntegrationConnection({
          integration: meta.integration,
          ...(credentials ? { credentials } : {}),
        }).then((r) =>
          r.ok && !r.data.ok
            ? { ok: false as const, error: r.data.error ?? "Conexión fallida" }
            : r,
        ),
      { successMessage: "Conexión OK" },
    );
  }

  function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = typedCredentials();
    if (!credentials) {
      if (typedCount === 0) toast.error("Escribe las credenciales a guardar");
      return;
    }
    submit(
      () =>
        setIntegrationCredentials({
          integration: meta.integration,
          credentials,
        }),
      {
        successMessage: "Credenciales guardadas",
        onSuccess: () => setValues({}),
      },
    );
  }

  function onSyncNow() {
    submit(
      () =>
        runSyncNow({ integration: meta.integration }).then((r) =>
          r.ok && !r.data.ok
            ? { ok: false as const, error: r.data.error ?? "El sync falló" }
            : r,
        ),
      { successMessage: "Sincronización disparada" },
    );
  }

  function onClear() {
    if (!window.confirm(`¿Quitar las credenciales guardadas de ${meta.label}?`))
      return;
    submit(
      () => clearIntegrationCredentials({ integration: meta.integration }),
      { successMessage: "Credenciales eliminadas" },
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{meta.label}</h2>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <a
          href={meta.helpUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {meta.helpText} <ExternalLink className="size-3" />
        </a>
      </div>

      <IntegrationStatusLine status={status} label={meta.label} />

      <form onSubmit={onSave} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {meta.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`${meta.integration}-${field.name}`}>
                {field.label}
              </Label>
              <Input
                id={`${meta.integration}-${field.name}`}
                type={field.kind === "email" ? "email" : "password"}
                autoComplete="off"
                placeholder={
                  status.configured ? "Guardada — escribe para reemplazar" : ""
                }
                value={values[field.name] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
              />
              {fieldErrors[field.name] && (
                <p className="text-xs text-destructive">
                  {fieldErrors[field.name][0]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || typedCount === 0}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onTest}
          >
            Probar conexión
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || (!status.configured && !status.envFallbackAvailable)}
            onClick={onSyncNow}
          >
            Sincronizar ahora
          </Button>
          {status.configured && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="text-muted-foreground hover:text-destructive"
              onClick={onClear}
            >
              Quitar credenciales
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
