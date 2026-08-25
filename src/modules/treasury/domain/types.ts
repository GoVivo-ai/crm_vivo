import type { RecordSource } from "@/modules/finance/domain/types";

export type BankAccountView = {
  id: string;
  source: RecordSource; // editable solo cuando 'manual'
  name: string;
  type: string | null; // 'bank' | 'cash' | 'credit-card'
  currencyCode: string;
  /** Saldo en la moneda de la cuenta. */
  balance: number;
  /** Saldo consolidado a COP (balance × TRM registrada, 1 si COP). */
  balanceCop: number;
  balanceUpdatedAt: Date | null;
  isActive: boolean;
};

export type BankTransactionView = {
  id: string;
  bankAccountId: string;
  bankName: string | null;
  date: string;
  amount: number;
  direction: "in" | "out";
  description: string | null;
};

export type TreasuryPosition = {
  accounts: BankAccountView[];
  /** Posición consolidada COP (cuentas activas). */
  totalCashCop: number;
  recentTransactions: BankTransactionView[];
  /** Proyección simple: caja + cartera por cobrar − cuentas por pagar. */
  projection: {
    cashCop: number;
    receivablesCop: number;
    payablesCop: number;
    netCop: number;
  };
};
