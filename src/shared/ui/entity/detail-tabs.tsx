"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DetailTab = { key: string; label: string; panel: React.ReactNode };

/** Tabs de vista-detalle (§15.1, mismo patrón del expediente §14):
 * subrayado verde de marca como elemento propio (ver la nota de module-tabs:
 * el truco del `background` solo funciona con gradientes); los tabs
 * restringidos llegan filtrados. */
export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Secciones del detalle"
        className="flex gap-5 overflow-x-auto border-b px-0.5"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={tab.key === current?.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative shrink-0 pb-2.5 text-[13px] font-bold whitespace-nowrap text-muted-foreground transition-colors",
              tab.key === current?.key && "font-extrabold text-foreground",
            )}
          >
            {tab.label}
            {tab.key === current?.key && (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#04D98B]"
              />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.panel}</div>
    </div>
  );
}
