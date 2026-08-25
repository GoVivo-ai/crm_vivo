"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  parseCommand,
  TYPE_DEFS,
  type SpotlightCatalog,
  type SpotlightType,
} from "./parser";
import { SpotlightPanel } from "./spotlight-panel";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-md border border-white/[.18] bg-white/[.12] px-1.5 text-[10.5px] font-bold text-white/80">
      {children}
    </span>
  );
}

/** Confirmación sobre-lienzo (SpotlightConfirmar): pregunta blanca
 * centrada en el scrim; Cancelar con foco, rojo solo por clic. */
function OverCanvasDiscard({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 px-5 text-center">
      <p className="font-[family-name:var(--font-display)] text-[23px] font-extrabold text-white">
        ¿Descartar lo escrito?
      </p>
      <p className="max-w-sm text-[13.5px] font-semibold leading-relaxed text-white/65">
        Lo que escribiste en la barra se perderá; no se guardó nada.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          autoFocus
          className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={onKeep}
        >
          Seguir escribiendo
        </Button>
        <Button
          size="sm"
          className="bg-[#C93A3A] text-white hover:bg-[#B53232]"
          onClick={onDiscard}
        >
          Descartar
        </Button>
      </div>
    </div>
  );
}

/** Spotlight (§12.6): captura teclado-primero sobre el lienzo. Crea
 * registros, nunca edita. */
export function SpotlightOverlay({
  catalog,
  allowed,
  today,
  onClose,
}: {
  catalog: SpotlightCatalog;
  allowed: SpotlightType[];
  today: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(
    () => parseCommand(text, catalog, today),
    [text, catalog, today],
  );
  const type =
    parsed.type !== null && allowed.includes(parsed.type) ? parsed.type : null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (confirming) return; // lo maneja el propio confirm
      if (text.trim() !== "") setConfirming(true);
      else onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [text, confirming, onClose]);

  const chips = TYPE_DEFS.filter((d) => allowed.includes(d.key));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Captura rápida"
      className="fixed inset-0 z-50 overflow-y-auto motion-safe:animate-in motion-safe:fade-in motion-safe:duration-160"
      style={{
        background:
          "radial-gradient(720px 420px at 50% 18%, rgba(4,217,139,.14), transparent 70%), rgba(1,22,64,.74)",
      }}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (text.trim() !== "") setConfirming(true);
        else onClose();
      }}
    >
      {confirming ? (
        <div className="flex min-h-full items-center justify-center">
          <OverCanvasDiscard
            onKeep={() => {
              setConfirming(false);
              inputRef.current?.focus();
            }}
            onDiscard={onClose}
          />
        </div>
      ) : (
        <div className="mx-auto mt-24 flex w-[min(720px,92vw)] flex-col gap-3.5 pb-16">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-[2px]">
            <Plus className="size-[18px] shrink-0 text-[#04D98B]" />
            <input
              ref={inputRef}
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Escribe qué registrar: tipo, entidad, monto y fecha"
              placeholder="factura grupo andino 14.6"
              className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-display)] text-[17px] font-extrabold text-white caret-[#04D98B] outline-none placeholder:text-white/35"
            />
            <div className="hidden gap-1.5 sm:flex">
              {chips.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setText(`${d.words[0]} `);
                    inputRef.current?.focus();
                  }}
                  className="rounded-md outline-none focus-visible:outline-2 focus-visible:outline-[#04D98B]"
                  aria-label={`Registrar ${d.label}`}
                >
                  <Kbd>
                    {d.letter} {d.label}
                  </Kbd>
                </button>
              ))}
            </div>
          </div>

          {type ? (
            <SpotlightPanel
              key={type}
              type={type}
              parsed={parsed}
              catalog={catalog}
              today={today}
              onSaved={onClose}
              onCancel={onClose}
            />
          ) : (
            <p className="px-2 text-center text-xs font-semibold text-white/55">
              Escribe {"{tipo} {entidad} {monto} [fecha]"} — p.ej. «factura
              grupo andino 14.6» · «gasto figma 890k ayer» · Esc cierra
            </p>
          )}
        </div>
      )}
    </div>
  );
}
