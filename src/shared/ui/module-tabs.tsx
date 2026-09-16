"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ModuleTab = { href: string; label: string };

/**
 * Nivel 2 de navegación (DESIGN-SPEC §6): tabs dentro de la página con
 * subrayado verde de marca en la activa. El sidebar queda como
 * mapa de módulos sin segundo nivel.
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
              "pb-2.5 text-[13px] transition-colors",
              isActive
                ? "font-extrabold text-[#011640] [background:#04D98B_bottom/100%_3px_no-repeat]"
                : "font-bold text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
