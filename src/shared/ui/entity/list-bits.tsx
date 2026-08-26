import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { initialsOf, tintFor } from "./tints";

/** th canónico de lista (§15.2). */
export const LIST_TH =
  "px-5 py-2.5 text-left text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]";

export type ListChip = {
  href: string;
  label: string;
  active: boolean;
  /** Tinta del chip activo; por defecto navy tint. */
  cls?: string;
};

/** Chips de filtro por estado con conteos (§15.2, patrón facturas). */
export function ListChips({
  chips,
  ariaLabel = "Filtrar por estado",
}: {
  chips: ListChip[];
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href as Route}
          aria-current={chip.active ? "true" : undefined}
          className={cn(
            "rounded-full px-3 py-1 text-[11.5px] font-extrabold transition-colors",
            chip.active
              ? (chip.cls ?? "bg-[#E7EBF3] text-[#011640]")
              : "bg-[#EEF1F6] text-muted-foreground hover:text-foreground",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Celda identidad (§15.2): tile 32 r9 con iniciales sobre tinta rotada +
 * nombre 800 navy + identificador secundario en faint. Con href, la
 * celda lleva el overlay que hace navegar la fila ENTERA (el <tr> debe
 * ser `relative`).
 */
export function IdentityCell({
  id,
  name,
  sub,
  href,
}: {
  id: string;
  name: string;
  sub?: string | null;
  href?: Route;
}) {
  const tint = tintFor(id);
  return (
    <span className="flex items-center gap-3">
      {href && (
        <Link
          href={href}
          className="absolute inset-0"
          aria-label={`Abrir ${name}`}
        />
      )}
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[9px] font-[family-name:var(--font-display)] text-[11px] font-extrabold"
        style={{ background: tint.bg, color: tint.fg }}
      >
        {initialsOf(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-extrabold text-[#011640]">
          {name}
        </span>
        {sub && (
          <span className="block truncate text-[11.5px] text-[#8B99B0]">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}

export function RowChevron() {
  return <ChevronRight className="ml-auto size-4 text-[#8B99B0]" />;
}

/** Footer "Mostrando N de M" (§15.2). */
export function ListFooter({ shown, total }: { shown: number; total: number }) {
  return (
    <p className="border-t px-5 py-2.5 text-[11.5px] font-semibold text-[#8B99B0]">
      Mostrando {shown} de {total}
    </p>
  );
}
