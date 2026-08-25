"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Dialog de captura del spec §12.1: hairline gradiente firma de 3px,
 * header con tile del módulo en su tinta + chip "Manual", footer con
 * separador y verbo+objeto. Se usa DENTRO de <Dialog> con su trigger.
 */
export function CaptureDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
      showCloseButton={false}
      {...props}
    >
      <span
        aria-hidden
        className="block h-[3px] w-full bg-gradient-to-r from-[#04D98B] to-[#F2E205]"
      />
      {children}
    </DialogContent>
  );
}

// Tintas de área — valores canónicos en DESIGN-SPEC.md §2.
const TINTS = {
  green: "bg-[#E6F9F1] text-[#069B66]",
  blue: "bg-[#E8F0FB] text-[#1E5FBF]",
  gold: "bg-[#FBF7D9] text-[#8C7A0A]",
  navy: "bg-[#E7EBF3] text-[#011640]",
  neutral: "bg-[#EEF1F6] text-[#5A6B85]",
} as const;

export function CaptureDialogHeader({
  icon: Icon,
  tint,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  /** Tinta del área: factura verde, gasto azul, nómina ámbar, banco neutro. */
  tint: keyof typeof TINTS;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <span
        className={cn(
          "grid size-[34px] shrink-0 place-items-center rounded-[10px]",
          TINTS[tint],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <DialogTitle className="font-[family-name:var(--font-display)] text-[17px] font-extrabold text-[#011640]">
          {title}
        </DialogTitle>
        {subtitle ? (
          <DialogDescription className="text-[12.5px] font-semibold text-muted-foreground">
            {subtitle}
          </DialogDescription>
        ) : null}
      </div>
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-extrabold text-secondary-foreground">
        Manual
      </span>
      <DialogClose
        render={
          <Button variant="ghost" size="icon-sm" className="shrink-0" />
        }
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
    <div className={cn("flex flex-col gap-[18px] px-6 pb-5", className)}>
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
