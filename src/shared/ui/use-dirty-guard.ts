"use client";

import { useEffect, useRef, useState } from "react";

function serializeForm(form: HTMLFormElement | null): string {
  if (!form) return "";
  const entries = [...new FormData(form).entries()].map(([k, v]) => [
    k,
    String(v),
  ]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

/**
 * Guard "¿Descartar cambios?" del spec §12: al intentar cerrar un dialog
 * de captura, pregunta SOLO si hay cambios reales — un formulario intacto
 * (o revertido a su estado inicial) cierra libre. Compara los inputs del
 * form (FormData) más el estado controlado (segmented/combobox) que el
 * formulario declare en `extraState`.
 */
export function useDirtyGuard({
  open,
  setOpen,
  formRef,
  extraState,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  extraState?: unknown;
}) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const baseline = useRef<string | null>(null);
  const extraJson = JSON.stringify(extraState ?? null);
  const extraBaseline = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      baseline.current = null;
      extraBaseline.current = null;
      return;
    }
    // Captura tras el primer paint del dialog (el form ya existe).
    const raf = requestAnimationFrame(() => {
      baseline.current = serializeForm(formRef.current);
      extraBaseline.current = extraJson;
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseline solo al abrir
  }, [open]);

  function isDirty(): boolean {
    if (baseline.current === null) return false;
    return (
      serializeForm(formRef.current) !== baseline.current ||
      extraJson !== extraBaseline.current
    );
  }

  /** Úsalo como onOpenChange del Dialog de captura. */
  function guardedOnOpenChange(next: boolean) {
    if (!next && isDirty()) {
      setDiscardOpen(true);
      return;
    }
    setOpen(next);
  }

  /** Cierre confirmado desde el dialog de descarte. */
  function discard() {
    setDiscardOpen(false);
    setOpen(false);
  }

  return { guardedOnOpenChange, discardOpen, setDiscardOpen, discard };
}
