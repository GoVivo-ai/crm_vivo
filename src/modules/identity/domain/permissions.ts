export const ROLES = [
  "admin",
  "sales",
  "operations",
  "finance",
  "management",
] as const;
export type Role = (typeof ROLES)[number];

export const RESOURCES = [
  "dashboard",
  "crm",
  "clients",
  "finance",
  "marketing",
  "purchases",
  "people_directory",
  "people_compensation",
  "treasury",
  "profitability",
  "settings",
] as const;
export type Resource = (typeof RESOURCES)[number];

export type Action = "read" | "write";

type Grant = "rw" | "ro" | null;

/**
 * Matriz RBAC declarativa. Fuente única de verdad para las 3 capas de
 * enforcement: middleware por prefijo de ruta, guard requirePermission()
 * en Server Actions y sidebar condicional.
 */
const MATRIX: Record<Role, Record<Resource, Grant>> = {
  admin: {
    dashboard: "rw",
    crm: "rw",
    clients: "rw",
    finance: "rw",
    marketing: "rw",
    purchases: "rw",
    people_directory: "rw",
    people_compensation: "rw",
    treasury: "rw",
    profitability: "rw",
    settings: "rw",
  },
  management: {
    dashboard: "ro",
    crm: "ro",
    clients: "ro",
    finance: "ro",
    marketing: "ro",
    purchases: "ro",
    people_directory: "rw",
    people_compensation: "ro",
    treasury: "ro",
    profitability: "ro",
    settings: null,
  },
  sales: {
    dashboard: "ro",
    crm: "rw",
    clients: "ro",
    finance: null,
    marketing: null,
    purchases: null,
    people_directory: "ro",
    people_compensation: null,
    treasury: null,
    profitability: null,
    settings: null,
  },
  operations: {
    dashboard: "ro",
    crm: "ro",
    clients: "rw",
    finance: null,
    // rw para vincular cuentas publicitarias a clientes (setAdAccountLink).
    marketing: "rw",
    purchases: null,
    people_directory: "ro",
    people_compensation: null,
    treasury: null,
    profitability: null,
    settings: null,
  },
  finance: {
    dashboard: "ro",
    crm: null,
    clients: "ro",
    finance: "rw",
    marketing: null,
    purchases: "rw",
    people_directory: "ro",
    // Compensación: registrar pagos de nómina es tarea de finanzas
    // (decisión Planeador 2026-08-25).
    people_compensation: "rw",
    treasury: "rw",
    profitability: "ro",
    settings: null,
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  const grant = MATRIX[role][resource];
  if (grant === null) return false;
  return action === "read" || grant === "rw";
}

/** Recursos legibles por un rol — para pintar el sidebar por rol. */
export function readableResources(role: Role): Resource[] {
  return RESOURCES.filter((resource) => can(role, resource, "read"));
}

/** Mapeo prefijo de ruta → recurso, usado por el middleware. */
export const ROUTE_RESOURCES: Record<string, Resource> = {
  "/crm": "crm",
  "/clients": "clients",
  "/finance": "finance",
  "/marketing": "marketing",
  "/purchases": "purchases",
  "/people": "people_directory",
  "/treasury": "treasury",
  "/profitability": "profitability",
  "/settings": "settings",
};
