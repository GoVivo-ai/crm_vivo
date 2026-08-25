"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Confirmación destructiva del spec §12.4 — reemplaza a window.confirm.
 * 420px, sin hairline; Cancelar con foco inicial; el botón rojo lleva
 * verbo+objeto y Enter no lo dispara salvo que tenga el foco.
 */
export function ConfirmDialog({
  trigger,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  pending = false,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  /** Elemento que abre el dialog; omítelo en modo controlado. */
  trigger?: React.ReactElement;
  /** Modo controlado (p.ej. guard de descartar cambios). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Con el objeto concreto: "¿Eliminar la factura FV-2041?". */
  title: string;
  /** La consecuencia real y qué no se puede deshacer. */
  body: string;
  /** Verbo + objeto: "Eliminar factura" — nunca "Aceptar". */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
  /** Contenido extra (p.ej. nota de rechazo) entre el cuerpo y las acciones. */
  children?: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FAEAEA] text-[#C93A3A]">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-[family-name:var(--font-display)] text-base font-extrabold text-[#011640]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] font-semibold text-muted-foreground">
              {body}
            </DialogDescription>
          </div>
        </div>
        {children}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            autoFocus
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            className="bg-[#C93A3A] text-white hover:bg-[#B53232]"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
