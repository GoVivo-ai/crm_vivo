// Tipos de la API QuickBooks Online v3 (entidades mínimas que sincronizamos).
// PENDIENTE: validar contra el sandbox de Intuit cuando exista la app.

export interface QboRef {
  value: string;
  name?: string;
}

export interface QboCurrencyRef {
  value: string; // "USD", "COP"...
}

export interface QboInvoice {
  Id: string;
  DocNumber?: string;
  CustomerRef?: QboRef;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CurrencyRef?: QboCurrencyRef;
  ExchangeRate?: number;
}

export interface QboBill {
  Id: string;
  DocNumber?: string;
  VendorRef?: QboRef;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CurrencyRef?: QboCurrencyRef;
}

/** Gasto directo (aquí llegan los cargos de Chase ya categorizados). */
export interface QboPurchase {
  Id: string;
  PaymentType?: "Cash" | "Check" | "CreditCard";
  AccountRef?: QboRef;
  EntityRef?: QboRef;
  TxnDate?: string;
  TotalAmt?: number;
  CurrencyRef?: QboCurrencyRef;
}

export interface QboAccount {
  Id: string;
  Name: string;
  AccountType?: string; // "Bank" | "Credit Card" | ...
  AccountSubType?: string;
  CurrentBalance?: number;
  CurrencyRef?: QboCurrencyRef;
  Active?: boolean;
}

export interface QboCompanyInfo {
  CompanyName?: string;
  Country?: string;
}

/** Envoltorio de /query: { QueryResponse: { Invoice: [...], ... } } */
export type QboQueryResponse<K extends string, T> = {
  QueryResponse: Partial<Record<K, T[]>> & {
    startPosition?: number;
    maxResults?: number;
  };
};
