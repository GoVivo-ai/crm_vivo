// Tipos de dominio de Clientes y Proyectos expuestos a la UI.

export type ProjectHealth = "green" | "yellow" | "red" | "unknown";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  defaultMonthlyFee: number | null;
  isActive: boolean;
};

export type AccountService = {
  id: string;
  accountId: string;
  serviceId: string;
  monthlyFee: number;
  currency: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  isActive: boolean;
};

/** Servicio contratado con el nombre del catálogo, para la vista 360. */
export type AccountServiceWithName = AccountService & {
  serviceName: string;
};

export type Project = {
  id: string;
  accountId: string;
  name: string;
  clickupListId: string | null;
  health: ProjectHealth;
  syncedProgress: unknown;
  startDate: string | null;
  endDate: string | null;
};
