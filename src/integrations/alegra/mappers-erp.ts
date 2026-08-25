import type {
  syncedBills,
  syncedSupplierPayments,
} from "@/modules/purchases/schema";
import type { syncedEmployees } from "@/modules/people/schema";
import type {
  syncedBankAccounts,
  syncedBankTransactions,
} from "@/modules/treasury/schema";
import type {
  AlegraBankAccount,
  AlegraBankTransaction,
  AlegraBill,
  AlegraEmployee,
} from "@/integrations/alegra/erp-types";
import type { AlegraPayment } from "@/integrations/alegra/types";

function num(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

export function mapBill(bill: AlegraBill): typeof syncedBills.$inferInsert {
  return {
    alegraBillId: String(bill.id),
    numberFull: bill.numberTemplate?.fullNumber ?? null,
    alegraProviderId: bill.provider ? String(bill.provider.id) : null,
    providerName: bill.provider?.name ?? null,
    date: bill.date ?? null,
    dueDate: bill.dueDate ?? null,
    status: bill.status ?? null,
    total: num(bill.total),
    totalPaid: num(bill.totalPaid),
    balance: num(bill.balance),
    costCenter: bill.costCenter?.name ?? null,
    raw: bill,
    syncedAt: new Date(),
  };
}

/** Solo pagos type=out (los egresos que sync core descarta). */
export function mapSupplierPayment(
  payment: AlegraPayment,
): typeof syncedSupplierPayments.$inferInsert {
  return {
    alegraPaymentId: String(payment.id),
    alegraProviderId: payment.client ? String(payment.client.id) : null,
    providerName: payment.client?.name ?? null,
    date: payment.date ?? null,
    amount: num(payment.amount),
    // Desglose contable (Salario por Pagar, Aportes, Retenciones…):
    // base del "costo de nómina (desde pagos)" — el plan de Alegra no
    // permite leer nóminas liquidadas (402 APC1008).
    categories:
      payment.categories?.map((c) => ({
        id: String(c.id),
        name: c.name ?? null,
        total: c.total ?? null,
      })) ?? [],
    billIds: [],
    bankAccount: payment.bankAccount?.name ?? null,
    costCenter: payment.costCenter?.name ?? null,
    raw: payment,
    syncedAt: new Date(),
  };
}

/** Filtra las ~21 filas fantasma de la API (todos los campos null). */
export function isRealEmployee(employee: AlegraEmployee): boolean {
  return employee.names != null;
}

export function mapEmployee(
  employee: AlegraEmployee,
): typeof syncedEmployees.$inferInsert {
  return {
    alegraEmployeeId: employee.id,
    names: employee.names ?? null,
    lastNames: employee.lastNames ?? null,
    identification: employee.identification ?? null,
    position: employee.position ?? null,
    area: employee.area ?? null,
    salary: num(employee.salary),
    status: employee.status ?? null,
    email: employee.email ?? null,
    phone: employee.phone ?? null,
    hiredAt: employee.contract?.startDate ?? null,
    // La API de Alegra NO expone fecha de nacimiento (verificado): null.
    birthday: null,
    contract: employee.contract ?? null,
    raw: employee,
    syncedAt: new Date(),
  };
}

export function mapBankAccount(
  account: AlegraBankAccount,
): typeof syncedBankAccounts.$inferInsert {
  return {
    alegraBankId: String(account.id),
    name: account.name,
    number: account.number ?? null,
    type: account.type ?? null,
    status: account.status ?? null,
    balance: num(account.balance),
    // Ya normalizado a COP por Alegra: fuente de la posición consolidada.
    mainCurrencyBalance: num(account.mainCurrencyBalance),
    currencyCode: account.currency?.currencyCode ?? "COP",
    exchangeRate: num(account.currency?.exchangeRate),
    raw: account,
    syncedAt: new Date(),
  };
}

export function mapBankTransaction(
  transaction: AlegraBankTransaction,
  alegraBankId: string,
): typeof syncedBankTransactions.$inferInsert {
  return {
    alegraTransactionId: String(transaction.id),
    alegraBankId,
    date: transaction.date ?? null,
    amount: num(transaction.amount),
    type: transaction.type ?? null,
    status: transaction.status ?? null,
    movementType: transaction.movementType ?? null,
    clientName: transaction.client?.name ?? null,
    clientIdentification: transaction.client?.identification ?? null,
    associations: transaction.associations ?? null,
    anotation: transaction.anotation ?? null,
    raw: transaction,
    syncedAt: new Date(),
  };
}
