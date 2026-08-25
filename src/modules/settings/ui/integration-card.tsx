"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  clearIntegrationCredentials,
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
  /** Hoy YYYY-MM-DD (server), para calcular el vencimiento del token. */
  today: string;
};

/** Tarjeta de integración — conexión SOLO por OAuth (cero tokens manuales). */
export function IntegrationCard({ meta, status, today }: IntegrationCardProps) {
  const { submit, pending } = useActionSubmit<unknown>();
  const connected = status.configured || status.envFallbackAvailable;

  function onTest() {
    submit(
      () =>
        testIntegrationConnection({ integration: meta.integration }).then(
          (r) =>
            r.ok && !r.data.ok
              ? {
                  ok: false as const,
                  error: r.data.error ?? "Conexión fallida",
                }
              : r,
        ),
      { successMessage: "Conexión OK" },
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

  function onDisconnect() {
    if (
      !window.confirm(
        `¿Desconectar ${meta.label}? Podrás volver a conectar cuando quieras.`,
      )
    )
      return;
    submit(
      () => clearIntegrationCredentials({ integration: meta.integration }),
      { successMessage: `${meta.label} desconectado` },
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
            // Logos pequeños (SVG incluidos): sin optimizador.
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
              return days >= 0 ? ` · conexión vence en ${days} d` : "";
            })()}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {status.reconnectRequired ? (
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
        ) : null}
        {connected && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={onTest}
            >
              Probar conexión
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={onSyncNow}
            >
              Sincronizar
            </Button>
          </>
        )}
        {status.configured && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className="text-muted-foreground hover:text-destructive"
            onClick={onDisconnect}
          >
            Desconectar
          </Button>
        )}
      </div>

      {!status.configured && (
        <p className="text-xs text-muted-foreground">{meta.helpText}.</p>
      )}
    </section>
  );
}
