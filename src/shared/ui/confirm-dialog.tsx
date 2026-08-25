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
  onConfirm,
  pending = false,
  children,
}: {
  /** Elemento que abre el dialog (Button ghost "Borrar", etc.). */
  trigger: React.ReactElement;
  /** Con el objeto concreto: "¿Eliminar la factura FV-2041?". */
  title: string;
  /** La consecuencia real y qué no se puede deshacer. */
  body: string;
  /** Verbo + objeto: "Eliminar factura" — nunca "Aceptar". */
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  /** Contenido extra (p.ej. nota de rechazo) entre el cuerpo y las acciones. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
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
            Cancelar
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
