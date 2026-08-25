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
    settings: "rw",
  },
  management: {
    dashboard: "ro",
    crm: "ro",
    clients: "ro",
    finance: "ro",
    marketing: "ro",
    settings: null,
  },
  sales: {
    dashboard: "ro",
    crm: "rw",
    clients: "ro",
    finance: null,
    marketing: null,
    settings: null,
  },
  operations: {
    dashboard: "ro",
    crm: "ro",
    clients: "rw",
    finance: null,
    marketing: null,
    settings: null,
  },
  finance: {
    dashboard: "ro",
    crm: null,
    clients: "ro",
    finance: "rw",
    marketing: null,
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
  "/settings": "settings",
};
