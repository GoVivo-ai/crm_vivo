export type BankAccountView = {
  id: string;
  alegraBankId: string;
  name: string;
  number: string | null;
  type: string | null; // 'bank'|'cash'|'credit-card'
  status: string | null;
  /** Saldo en la moneda de la cuenta. */
  balance: number | null;
  currencyCode: string;
  /** Saldo normalizado a COP por Alegra — el que suma la posición. */
  balanceCop: number | null;
  syncedAt: Date;
};

export type BankTransactionView = {
  id: string;
  alegraBankId: string;
  bankName: string | null;
  date: string | null;
  amount: number | null;
  type: string | null; // 'in'|'out'
  movementType: string | null;
  clientName: string | null;
  associations: string | null;
  anotation: string | null;
};

export type TreasuryPosition = {
  accounts: BankAccountView[];
  /** Posición consolidada en COP (suma de balanceCop de cuentas activas). */
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
