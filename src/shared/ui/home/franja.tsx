import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

export type Veredicto = "bien" | "atencion" | "problema" | "sindatos";

const VERDICT_STYLES: Record<Veredicto, string> = {
  bien: "bg-health-ok/10 text-health-ok",
  atencion: "bg-health-warn/10 text-health-warn",
  problema: "bg-health-critical/10 text-health-critical",
  // Neutro b-mut: sin datos no hay juicio (M4).
  sindatos: "bg-[#EEF1F6] text-[#5A6B85]",
};

const VERDICT_LABELS: Record<Veredicto, string> = {
  bien: "Bien",
  atencion: "Atención",
  problema: "Problema",
  sindatos: "Sin datos",
};

export function VerdictBadge({ verdict }: { verdict: Veredicto }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
        VERDICT_STYLES[verdict],
      )}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

type FranjaProps = {
  /** Color del punto del área (token CSS). */
  dot: string;
  label: string;
  verdict: Veredicto;
  href: Route;
  linkLabel: string;
  /** Gradiente firma superior — SOLO la franja Finanzas·Tesorería. */
  signature?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Franja del Home 360: punto + label + veredicto + "Abrir módulo →". */
export function Franja({
  dot,
  label,
  verdict,
  href,
  linkLabel,
  signature = false,
  className,
  children,
}: FranjaProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[14px] border bg-card px-6 pt-[18px] pb-5 shadow-xs",
        className,
      )}
    >
      {signature && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#04D98B] to-[#F2E205]"
        />
      )}
      <div className="mb-3.5 flex items-center gap-2.5">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: dot }}
        />
        <span className="text-[10.5px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </span>
        <VerdictBadge verdict={verdict} />
        <Link
          href={href}
          className="ml-auto text-xs font-bold text-health-ok hover:underline"
        >
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}
