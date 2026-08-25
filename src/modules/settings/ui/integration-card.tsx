"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearIntegrationCredentials,
  setIntegrationCredentials,
  testIntegrationConnection,
} from "@/modules/settings/application/integration-credentials-actions";
import { runSyncNow } from "@/modules/settings/application/run-sync-now-action";
import type { IntegrationStatus } from "@/modules/settings/domain/types";
import { CredentialsForm } from "@/modules/settings/ui/credentials-form";
import { IntegrationStatusLine } from "@/modules/settings/ui/integration-status-line";
import type { IntegrationMeta } from "@/modules/settings/ui/integrations-catalog";
import { useActionSubmit } from "@/shared/ui/use-action-submit";

type IntegrationCardProps = {
  meta: IntegrationMeta;
  status: IntegrationStatus;
  /** Hoy YYYY-MM-DD (server), para calcular el vencimiento del token. */
  today: string;
};

export function IntegrationCard({ meta, status, today }: IntegrationCardProps) {
  // Siempre cerrada al inicio (decisión de Victor); solo la abre el usuario.
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const { submit, pending, fieldErrors } = useActionSubmit<unknown>();
  const reducedMotion = useReducedMotion();

  const typedCount = meta.fields.filter((f) => values[f.name]?.trim()).length;

  function typedCredentials(): Record<string, string> | null {
    if (typedCount === 0) return null;
    if (typedCount < meta.fields.length) {
      toast.error("Completa todos los campos para usar esas credenciales");
      return null;
    }
    return Object.fromEntries(
      meta.fields.map((f) => [f.name, values[f.name].trim()]),
    );
  }

  function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = typedCredentials();
    if (!credentials) return;
    submit(
      () =>
        setIntegrationCredentials({ integration: meta.integration, credentials }),
      {
        successMessage: "Credenciales guardadas",
        onSuccess: () => {
          setValues({});
          setOpen(false);
        },
      },
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

  function onSyncNow(scope?: "core" | "erp") {
    submit(
      () =>
        runSyncNow({
          integration: meta.integration,
          ...(scope ? { scope } : {}),
        }).then((r) =>
          r.ok && !r.data.ok
            ? { ok: false as const, error: r.data.error ?? "El sync falló" }
            : r,
        ),
      { successMessage: "Sincronización disparada" },
    );
  }

  function onClear() {
    const question = meta.oauth
      ? `¿Desconectar ${meta.label}? Podrás volver a conectar cuando quieras.`
      : `¿Quitar las credenciales guardadas de ${meta.label}?`;
    if (!window.confirm(question)) return;
    submit(
      () => clearIntegrationCredentials({ integration: meta.integration }),
      { successMessage: "Credenciales eliminadas" },
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg border bg-white">
          <Image
            src={meta.logoSrc}
            alt=""
            width={30}
            height={30}
            // Logos de 30px (dos son SVG): el optimizador no aporta y
            // devuelve 400 para SVG sin dangerouslyAllowSVG global.
            unoptimized
            className="size-[30px] object-contain"
          />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{meta.label}</h2>
          <p className="text-xs leading-snug text-muted-foreground">
            {meta.description}
          </p>
        </div>
      </div>

      <IntegrationStatusLine status={status} label={meta.label} />

      {status.connectedAs && (
        <p className="text-xs text-muted-foreground">
          Conectado como{" "}
          <span className="font-medium text-foreground">
            {status.connectedAs}
          </span>
          {status.tokenExpiresAt &&
            (() => {
              const days = Math.floor(
                (Date.parse(status.tokenExpiresAt) - Date.parse(today)) /
                  86_400_000,
              );
              return days >= 0 ? ` · token vence en ${days} d` : "";
            })()}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {meta.oauth ? (
          // OAuth (cero tokens manuales): navegación normal al flujo.
          status.reconnectRequired ? (
            <Button
              variant="destructive"
              size="sm"
              render={<a href={`/api/oauth/${meta.integration}/start`} />}
            >
              Reconectar con {meta.label}
            </Button>
          ) : !status.configured ? (
            <Button
              size="sm"
              render={<a href={`/api/oauth/${meta.integration}/start`} />}
            >
              Conectar con {meta.label}
            </Button>
          ) : null
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {status.configured ? "Credenciales" : "Configurar credenciales"}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  open && "rotate-180",
                )}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={onTest}
            >
              Probar conexión
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={pending || (!status.configured && !status.envFallbackAvailable)}
          onClick={() => onSyncNow()}
        >
          Sincronizar
        </Button>
        {meta.integration === "alegra" && (
          <Button
            variant="outline"
            size="sm"
            disabled={
              pending || (!status.configured && !status.envFallbackAvailable)
            }
            title="Gastos, nómina y bancos (módulos ERP)"
            onClick={() => onSyncNow("erp")}
          >
            Sincronizar ERP
          </Button>
        )}
        {status.configured && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className="text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            {meta.oauth ? "Desconectar" : "Quitar"}
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="form"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <CredentialsForm
              meta={meta}
              configured={status.configured}
              values={values}
              onChange={(name, value) =>
                setValues((prev) => ({ ...prev, [name]: value }))
              }
              fieldErrors={fieldErrors}
              pending={pending}
              typedCount={typedCount}
              onSubmit={onSave}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
