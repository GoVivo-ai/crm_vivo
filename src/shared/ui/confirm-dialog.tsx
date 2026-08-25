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
import { CaptureLomo } from "@/shared/ui/capture-dialog";

/**
 * Confirmación destructiva "lomo rojo" (§12.4) — misma anatomía del Lomo
 * con severidad evidente: aura roja, eyebrow "Irreversible", el objeto en
 * peligro nombrado en el lomo y costura roja SÓLIDA (jamás gradiente).
 * Cancelar con foco inicial; Enter no dispara el destructivo.
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
  objectName,
}: {
  /** Elemento que abre el dialog; omítelo en modo controlado. */
  trigger?: React.ReactElement;
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
  /** El objeto en peligro, nombrado en el lomo ("FV-2041"). */
  objectName?: string;
  /** Contenido extra (p.ej. nota de rechazo) entre el cuerpo y las acciones. */
  children?: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        showCloseButton={false}
        className="grid gap-0 overflow-hidden p-0 sm:max-w-[520px] min-[1100px]:grid-cols-[110px_3px_1fr] max-[1099px]:grid-cols-1 max-[1099px]:grid-rows-[auto_3px_1fr]"
      >
        <CaptureLomo
          icon={TriangleAlert}
          module="Confirmar"
          title="Acción destructiva"
          tone="red"
          eyebrowBottom="Irreversible"
          bottomHighlight={objectName ?? " "}
        />
        <div className="flex min-w-0 flex-col gap-3 p-6">
          <DialogTitle className="font-[family-name:var(--font-display)] text-base font-extrabold text-[#011640]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] font-semibold text-muted-foreground">
            {body}
          </DialogDescription>
          {children}
          <div className="mt-1 flex justify-end gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
