"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type FileTab = { key: string; label: string; panel: React.ReactNode };

/** Tabs del expediente (§14): subrayado gradiente firma; los tabs
 * restringidos (p.ej. Compensación) NI SE MONTAN — llegan filtrados. */
export function FileTabs({ tabs }: { tabs: FileTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Secciones del expediente"
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
              "shrink-0 pb-2.5 text-[13px] font-bold whitespace-nowrap text-muted-foreground transition-colors",
              tab.key === current?.key &&
                "font-extrabold text-[#011640] [background:linear-gradient(90deg,#04D98B,#F2E205)_bottom/100%_3px_no-repeat]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.panel}</div>
    </div>
  );
}
