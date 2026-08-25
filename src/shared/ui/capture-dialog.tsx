"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Debounce ~150ms del contexto vivo: nunca parpadea por tecla (§12.1). */
function useDebounced<T>(value: T, ms = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export type LomoContext = {
  /** Monto ya formateado — protagonista en 20px #04D98B tabular. */
  amount?: string | null;
  /** Entidad (cliente, cuenta, persona). */
  entity?: string | null;
  /** Hecho útil del módulo si el contrato lo da (saldo, MRR…). */
  fact?: string | null;
};

/**
 * Dialog "Lomo navy" (§12.1): franja estructural navy + costura gradiente
 * + cuerpo blanco. Ningún dialog vuelve a ser un rectángulo blanco.
 * Estructura: <CaptureDialogContent><CaptureLomo/><div body…></div>
 */
export function CaptureDialogContent({
  className,
  children,
  wide = false,
  ...props
}: React.ComponentProps<typeof DialogContent> & { wide?: boolean }) {
  return (
    <DialogContent
      className={cn(
        "grid gap-0 overflow-hidden p-0 shadow-[0_32px_80px_-28px_rgba(1,22,64,0.55)] duration-200 data-open:zoom-in-[0.97]",
        // Móvil: sheet de borde inferior con la misma cabecera (§12.1).
        "max-sm:top-auto! max-sm:bottom-0! max-sm:left-0! max-sm:w-full! max-sm:max-w-full! max-sm:translate-x-0! max-sm:translate-y-0! max-sm:rounded-b-none! max-sm:max-h-[92dvh] max-sm:overflow-y-auto",
        wide ? "sm:max-w-[680px]" : "sm:max-w-[560px]",
        // Lomo vertical en pantallas anchas; cabecera horizontal en <1100px.
        "min-[1100px]:grid-cols-[var(--lomo-w)_3px_1fr]",
        "max-[1099px]:grid-cols-1 max-[1099px]:grid-rows-[auto_3px_1fr]",
        className,
      )}
      style={{ "--lomo-w": wide ? "150px" : "130px" } as React.CSSProperties}
      showCloseButton={false}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

const TILE_TONES = {
  green: "bg-[rgba(4,217,139,0.18)] text-[#04D98B]",
  red: "bg-[rgba(201,58,58,0.30)] text-[#F08A8A]",
} as const;

export function CaptureLomo({
  icon: Icon,
  module,
  title,
  context,
  tone = "green",
  eyebrowBottom = "Contexto vivo",
  bottomHighlight,
}: {
  icon: LucideIcon;
  /** Eyebrow del módulo: "FINANZAS", "CRM"… */
  module: string;
  /** Título corto: "Nueva factura". */
  title: string;
  context?: LomoContext;
  /** red = confirmación destructiva (§12.4). */
  tone?: "green" | "red";
  /** Eyebrow inferior ("Contexto vivo" / "Irreversible"). */
  eyebrowBottom?: string;
  /** Texto destacado inferior en tono (p.ej. el objeto en peligro). */
  bottomHighlight?: string;
}) {
  const amount = useDebounced(context?.amount ?? null);
  const entity = useDebounced(context?.entity ?? null);
  const fact = useDebounced(context?.fact ?? null);
  const red = tone === "red";

  return (
    <>
      <div
        className="relative flex flex-col overflow-hidden bg-[#011640] p-4 min-[1100px]:min-h-full max-[1099px]:flex-row max-[1099px]:items-center max-[1099px]:gap-3"
        style={{
          backgroundImage: red
            ? "radial-gradient(160px 150px at -30px -20px, rgba(201,58,58,0.28), transparent 70%)"
            : "radial-gradient(220px 200px at -40px -30px, rgba(4,217,139,0.20), transparent 70%)",
        }}
      >
        <Image
          src="/brand/logomark-white.png"
          alt=""
          width={110}
          height={81}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-6 -bottom-4 -rotate-12 select-none",
            red ? "opacity-[0.08]" : "opacity-10",
          )}
        />
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-[11px]",
            TILE_TONES[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 max-[1099px]:flex-1">
          {/* Rótulos vacíos = lomo neutro (descarte de borrador, §12.4). */}
          {module && (
            <p className="mt-2.5 text-[10px] font-extrabold tracking-[0.16em] text-white/55 uppercase max-[1099px]:mt-0">
              {module}
            </p>
          )}
          {title && (
            <DialogTitle className="font-[family-name:var(--font-display)] text-[15px] leading-tight font-extrabold text-white">
              {title}
            </DialogTitle>
          )}
        </div>
        <div className="mt-auto min-w-0 pt-4 max-[1099px]:mt-0 max-[1099px]:pt-0 max-[1099px]:text-right">
          <p className="text-[9.5px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
            {eyebrowBottom}
          </p>
          {bottomHighlight ? (
            <p className="truncate text-[13px] font-extrabold text-[#F08A8A]">
              {bottomHighlight}
            </p>
          ) : (
            <div className="transition-opacity duration-150">
              <p className="truncate font-[family-name:var(--font-display)] text-[20px] leading-tight font-extrabold text-[#04D98B] tabular-nums">
                {amount || <span className="text-white/35">—</span>}
              </p>
              {entity && (
                <p className="truncate text-[11.5px] font-bold text-white/70">
                  {entity}
                </p>
              )}
              {fact && (
                <p className="truncate text-[10.5px] font-semibold text-white/45">
                  {fact}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Costura: gradiente firma; ROJA sólida en destructivo. */}
      <span
        aria-hidden
        className={cn(
          red
            ? "bg-[#C93A3A]"
            : "bg-gradient-to-b from-[#04D98B] to-[#F2E205] max-[1099px]:bg-gradient-to-r",
        )}
      />
    </>
  );
}

/** Fila superior del cuerpo: chip de fuente + X ghost (§12.1). */
export function CaptureDialogBar({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 px-6 pt-4 pb-1">
      {subtitle ? (
        <DialogDescription className="text-[12.5px] font-semibold text-muted-foreground">
          {subtitle}
        </DialogDescription>
      ) : (
        <span />
      )}
      <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-extrabold text-secondary-foreground">
        Manual
      </span>
      <DialogClose
        render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}
        aria-label="Cerrar"
      >
        ×
      </DialogClose>
    </div>
  );
}

/** Body con el gap del spec; envuélvelo alrededor de los campos. */
export function CaptureDialogBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 px-6 pb-5", className)}>
      {children}
    </div>
  );
}

export function CaptureDialogFooter({
  submitLabel,
  pending,
  onSaveAnother,
}: {
  /** Verbo + objeto: "Guardar factura". */
  submitLabel: string;
  pending: boolean;
  /** Captura frecuente: "Guardar y crear otra" a la izquierda. */
  onSaveAnother?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-[#EDF0F5] px-6 py-4">
      {onSaveAnother && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onSaveAnother}
        >
          Guardar y crear otra
        </Button>
      )}
      <span className="flex-1" />
      <DialogClose render={<Button variant="ghost" size="sm" />}>
        Cancelar
      </DialogClose>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </div>
  );
}
