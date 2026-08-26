import Link from "next/link";
import type { Invoice } from "@/modules/finance/domain/types";
import { formatIsoDate } from "@/modules/people/ui/file/helpers";
import { formatCurrency } from "@/shared/ui/format";
import { SourceBadge } from "@/shared/ui/source-badge";

const STATUS: Record<
  Invoice["status"],
  { label: string; cls: string }
> = {
  open: { label: "Pendiente", cls: "bg-[#FBF7D9] text-[#8C7A0A]" },
  paid: { label: "Pagada", cls: "bg-[#E6F9F1] text-[#069B66]" },
  void: { label: "Anulada", cls: "bg-[#EEF1F6] text-[#5A6B85]" },
};

const TH =
  "px-5 py-2 text-left text-[10.5px] font-bold tracking-[0.09em] uppercase text-[#8B99B0]";

/** Facturación del 360 (artboard): fila con chip de fuente y badge de
 * estado; cifras en tabular, fechas es-CO. */
export function InvoicesCard({
  invoices,
  limit,
}: {
  invoices: Invoice[];
  /** Con límite muestra "Ver todas →" a /finance/invoices. */
  limit?: number;
}) {
  const visible = limit ? invoices.slice(0, limit) : invoices;
  return (
    <section className="rounded-[14px] border bg-card shadow-[0_1px_2px_rgba(1,22,64,0.04)]">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-[#011640]">
          {limit ? "Facturación reciente" : "Facturación"}
        </h2>
        {limit && invoices.length > limit && (
          <Link
            href="/finance/invoices"
            className="ml-auto text-xs font-bold text-[#069B66] hover:text-[#045C3D]"
          >
            Ver todas ({invoices.length}) →
          </Link>
        )}
      </div>
      {invoices.length === 0 ? (
        <p className="px-5 pt-2.5 pb-4 text-xs font-semibold text-muted-foreground">
          Sin facturas para esta cuenta todavía.
        </p>
      ) : (
        <div className="overflow-x-auto pt-2 pb-1.5">
          <table className="w-full text-[13px] font-semibold">
            <thead>
              <tr className="border-b">
                <th className={TH}>Factura</th>
                <th className={TH}>Emitida</th>
                <th className={TH}>Vence</th>
                <th className={`${TH} text-right`}>Monto</th>
                <th className={TH}>Fuente</th>
                <th className={TH}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((inv) => {
                const st = STATUS[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-[#EDF0F5] last:border-b-0"
                  >
                    <td className="px-5 py-2.5 font-extrabold">
                      {inv.number ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">
                      {formatIsoDate(inv.issueDate)}
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">
                      {inv.dueDate ? formatIsoDate(inv.dueDate) : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right font-extrabold tabular-nums">
                      {formatCurrency(inv.total, inv.currencyCode)}
                    </td>
                    <td className="px-5 py-2.5">
                      <SourceBadge source={inv.source} />
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
