"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleTab = { href: string; label: string };

/**
 * Nivel 2 de navegación (DESIGN-SPEC §6): tabs dentro de la página con
 * subrayado verde de marca en la activa. El sidebar queda como
 * mapa de módulos sin segundo nivel.
 *
 * El subrayado es un elemento propio, NO `background:<color> bottom/100% 3px`:
 * en ese shorthand un color plano se aplica como background-color y rellena el
 * tab entero (el size solo vale para imágenes). Funcionaba solo mientras fue un
 * gradiente.
 */
export function ModuleTabs({ tabs }: { tabs: ModuleTab[] }) {
  const pathname = usePathname();
  const matching = tabs.filter((t) => pathname.startsWith(t.href));
  const active = matching.reduce(
    (a, b) => (b.href.length > (a?.href.length ?? 0) ? b : a),
    matching[0],
  );

  return (
    <nav
      aria-label="Secciones del módulo"
      className="flex gap-5 border-b px-1"
    >
      {tabs.map((tab) => {
        const isActive = active?.href === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative pb-2.5 text-[13px] transition-colors",
              isActive
                ? "font-extrabold text-foreground"
                : "font-bold text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#04D98B]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
