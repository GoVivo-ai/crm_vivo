import { deletePayrollPayment } from "@/modules/people/application/team-actions";
import type { PayrollPayment } from "@/modules/people/domain/types";
import { DeleteRecordButton } from "@/shared/ui/delete-record-button";
import { formatCurrency } from "@/shared/ui/format";

/** Pagos de nómina recientes (people_compensation). */
export function PayrollPaymentsList({
  payments,
  canWrite,
}: {
  payments: PayrollPayment[];
  /** people_compensation:write — sin él no se renderiza borrar. */
  canWrite: boolean;
}) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin pagos registrados todavía — la serie de costo de nómina se
        construye desde aquí.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {payments.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {p.employeeName ?? "—"} · {p.period}
            </p>
            <p className="text-xs text-muted-foreground">
              pagado el {p.paidAt}
              {p.notes ? ` · ${p.notes}` : ""}
            </p>
          </div>
          <span className="font-mono text-sm">
            {formatCurrency(p.amount, p.currencyCode)}
          </span>
          {canWrite && (
            <DeleteRecordButton
              action={deletePayrollPayment}
              id={p.id}
              title={`¿Borrar el pago de ${p.employeeName ?? "?"} (${p.period})?`}
              body="Deja de contar en el costo de nómina y en rentabilidad. Esta acción no se puede deshacer."
              confirmLabel="Borrar pago"
                    objectName={p.employeeName ?? undefined}
              successMessage={`Pago de ${p.employeeName ?? "nómina"} borrado`}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
