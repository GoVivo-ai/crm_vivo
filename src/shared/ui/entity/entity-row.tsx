import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { initialsOf, tintFor } from "./tints";

/**
 * Fila-entidad estándar (§15.1): tile 30 tinta + nombre 800 + meta +
 * valor/badge a la derecha + chevron. Con href, toda la fila navega.
 */
export function EntityRow({
  id,
  name,
  meta,
  right,
  href,
}: {
  /** Semilla de la tinta (estable por entidad). */
  id: string;
  name: string;
  meta?: string | null;
  right?: React.ReactNode;
  href?: Route;
}) {
  const tint = tintFor(id);
  const body = (
    <>
      <span
        className="grid size-[30px] shrink-0 place-items-center rounded-[9px] font-[family-name:var(--font-display)] text-[11px] font-extrabold"
        style={{ background: tint.bg, color: tint.fg }}
      >
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-extrabold">
          {name}
        </span>
        {meta && (
          <span className="block truncate text-[11.5px] font-semibold text-muted-foreground">
            {meta}
          </span>
        )}
      </span>
      {right}
      {href && <ChevronRight className="size-3.5 shrink-0 text-[#8B99B0]" />}
    </>
  );
  const cls =
    "flex items-center gap-3 border-b border-[#EDF0F5] py-2.5 last:border-b-0";
  return href ? (
    <Link href={href} className={`${cls} -mx-2 rounded-lg px-2 transition-colors hover:bg-[#F6F7F9]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
