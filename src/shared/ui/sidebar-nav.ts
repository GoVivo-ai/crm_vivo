import {
  Briefcase,
  Handshake,
  Landmark,
  Megaphone,
  Orbit,
  ReceiptText,
  Settings2,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Resource } from "@/modules/identity/domain/permissions";

export type NavItem = {
  resource: Resource;
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string }[];
};

export type NavGroup = {
  /** null = sin etiqueta (Ajustes al final). */
  label: string | null;
  items: NavItem[];
};

/** Agrupación del diseño aprobado: Panorama · Comercial · Dinero · Personas. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Panorama",
    items: [
      { resource: "dashboard", href: "/", label: "Inicio 360", icon: Orbit },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        resource: "crm",
        href: "/crm",
        label: "CRM",
        icon: Handshake,
        children: [
          { href: "/crm/pipeline", label: "Pipeline" },
          { href: "/crm/contacts", label: "Contactos" },
          { href: "/crm/accounts", label: "Cuentas" },
        ],
      },
      {
        resource: "clients",
        href: "/clients",
        label: "Clientes",
        icon: Briefcase,
        children: [
          { href: "/clients", label: "Cuentas cliente" },
          { href: "/clients/services", label: "Servicios" },
        ],
      },
      {
        resource: "marketing",
        href: "/marketing",
        label: "Marketing",
        icon: Megaphone,
        children: [
          { href: "/marketing", label: "Dashboard" },
          { href: "/marketing/accounts", label: "Cuentas de ads" },
        ],
      },
    ],
  },
  {
    label: "Dinero",
    items: [
      {
        resource: "finance",
        href: "/finance",
        label: "Finanzas",
        icon: Landmark,
        children: [
          { href: "/finance", label: "Dashboard" },
          { href: "/finance/invoices", label: "Facturas" },
        ],
      },
      {
        resource: "purchases",
        href: "/purchases",
        label: "Gastos",
        icon: ReceiptText,
        children: [
          { href: "/purchases", label: "Dashboard" },
          { href: "/purchases/expenses", label: "Registrados" },
        ],
      },
      {
        resource: "treasury",
        href: "/treasury",
        label: "Tesorería",
        icon: Wallet,
      },
      {
        resource: "profitability",
        href: "/profitability",
        label: "Rentabilidad",
        icon: TrendingUp,
        children: [
          { href: "/profitability", label: "Margen por cliente" },
          { href: "/profitability/staffing", label: "Asignaciones" },
        ],
      },
    ],
  },
  {
    label: "Personas",
    items: [
      {
        resource: "people_directory",
        href: "/people",
        label: "Equipo",
        icon: Users,
        children: [
          { href: "/people", label: "Directorio" },
          { href: "/people/leave", label: "Ausencias" },
        ],
      },
    ],
  },
  {
    label: null,
    items: [
      {
        resource: "settings",
        href: "/settings",
        label: "Ajustes",
        icon: Settings2,
        children: [
          { href: "/settings", label: "Usuarios" },
          { href: "/settings/integrations", label: "Integraciones" },
        ],
      },
    ],
  },
];
