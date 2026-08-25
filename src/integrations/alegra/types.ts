// Tipos del payload "light" de Alegra (validado contra la API real).

export interface AlegraNumberTemplate {
  fullNumber?: string;
  prefix?: string | null;
  number?: string;
}

export interface AlegraClientRef {
  id: string | number;
  name?: string;
  identification?: string;
}

export interface AlegraCurrency {
  code: string;
  exchangeRate?: string | number;
}

export interface AlegraInvoice {
  id: string | number;
  date?: string;
  dueDate?: string;
  status?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  totalPaid?: number;
  balance?: number;
  numberTemplate?: AlegraNumberTemplate;
  client?: AlegraClientRef;
  stamp?: { legalStatus?: string };
  currency?: AlegraCurrency;
}

export interface AlegraPaymentInvoiceRef {
  id: string | number;
  number?: string;
  amount?: number;
}

export interface AlegraPayment {
  id: string | number;
  date?: string;
  amount?: number;
  type?: "in" | "out";
  status?: string;
  client?: AlegraClientRef | null;
  invoices?: AlegraPaymentInvoiceRef[];
  bankAccount?: { name?: string } | null;
  costCenter?: { code?: string; name?: string } | null;
  currency?: AlegraCurrency;
}
