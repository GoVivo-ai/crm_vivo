"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationMeta } from "@/modules/settings/ui/integrations-catalog";

type CredentialsFormProps = {
  meta: IntegrationMeta;
  configured: boolean;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  fieldErrors: Record<string, string[]>;
  pending: boolean;
  typedCount: number;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

/** Campos de credenciales — los secretos JAMÁS se pre-llenan. */
export function CredentialsForm({
  meta,
  configured,
  values,
  onChange,
  fieldErrors,
  pending,
  typedCount,
  onSubmit,
}: CredentialsFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-lg bg-secondary/60 p-4"
    >
      {meta.fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`${meta.integration}-${field.name}`}>
            {field.label}
          </Label>
          <Input
            id={`${meta.integration}-${field.name}`}
            type={field.kind === "email" ? "email" : "password"}
            autoComplete="off"
            className="bg-card"
            placeholder={
              configured ? "Guardada — escribe para reemplazar" : ""
            }
            value={values[field.name] ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
          {fieldErrors[field.name] && (
            <p className="text-xs text-destructive">
              {fieldErrors[field.name][0]}
            </p>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button type="submit" size="sm" disabled={pending || typedCount === 0}>
          Guardar credenciales
        </Button>
        <a
          href={meta.helpUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          ¿Dónde la consigo? {meta.helpText}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </form>
  );
}
