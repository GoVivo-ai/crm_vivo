import { cn } from "@/lib/utils";

/** Card del expediente: título Nunito 800 15px + slot derecho. */
export function FileCard({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Par clave/valor del artboard (.frow). Valor "—" cuando falta. */
export function FRow({
  k,
  v,
  className,
  span,
}: {
  k: string;
  v: React.ReactNode;
  className?: string;
  span?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3.5 border-b border-[#EDF0F5] py-2.5 last:border-b-0",
        span && "col-span-full",
      )}
    >
      <span className="shrink-0 text-[12.5px] font-semibold text-muted-foreground">
        {k}
      </span>
      <span className={cn("text-right text-[13px] font-bold", className)}>
        {v ?? "—"}
      </span>
    </div>
  );
}

/** Eyebrow del artboard (.lbl). */
export function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-[#8B99B0]">
      {children}
    </span>
  );
}

export const BADGE = {
  ok: "bg-[#E6F9F1] text-[#069B66]",
  warn: "bg-[#FBF7D9] text-[#8C7A0A]",
  bad: "bg-[#FAEAEA] text-[#C93A3A]",
  info: "bg-[#E8F0FB] text-[#1E5FBF]",
  mut: "bg-[#EEF1F6] text-[#5A6B85]",
} as const;

export function Badge({
  tone,
  children,
}: {
  tone: keyof typeof BADGE;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        BADGE[tone],
      )}
    >
      {children}
    </span>
  );
}
