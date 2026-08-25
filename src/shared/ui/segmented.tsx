"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * Segmented control del spec (§sistema): pista #EEF1F6 en píldora, opción
 * activa blanca con texto navy 800 y sombra suave.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-fit gap-0.5 rounded-full bg-[#EEF1F6] p-[3px]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-[5px] text-[11.5px] transition-colors",
              active
                ? "bg-white font-extrabold text-[#011640] shadow-[0_1px_2px_rgba(1,22,64,0.12)]"
                : "font-bold text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
