import type { Integration } from "@/modules/settings/domain/types";

export type CredentialField = {
  name: string;
  label: string;
  /** email se muestra como input email; el resto siempre password. */
  kind: "email" | "secret";
};

export type IntegrationMeta = {
  integration: Integration;
  label: string;
  description: string;
  /** Logo oficial en public/brand/integrations/. */
  logoSrc: string;
  /** true = se conecta con OAuth (botón Conectar); sin formulario de token. */
  oauth?: boolean;
  fields: CredentialField[];
  helpUrl: string;
  helpText: string;
};

/** Catálogo estático de las integraciones configurables (solo metadata). */
export const INTEGRATIONS_CATALOG: IntegrationMeta[] = [
  {
    integration: "alegra",
    label: "Alegra",
    description:
      "Facturación, cartera, P&L, cashflow, gastos, nómina y bancos. Se conecta con tu email y token de API (Alegra no ofrece OAuth).",
    logoSrc: "/brand/integrations/alegra.svg",
    fields: [
      { name: "email", label: "Email de la cuenta", kind: "email" },
      { name: "token", label: "Token de API", kind: "secret" },
    ],
    helpUrl: "https://app.alegra.com/configuration/api",
    helpText: "Alegra → Configuración → API",
  },
  {
    integration: "meta_ads",
    label: "Meta Ads",
    description: "Métricas de campañas de Meta (Marketing).",
    logoSrc: "/brand/integrations/meta.svg",
    oauth: true,
    fields: [],
    helpUrl: "https://business.facebook.com/",
    helpText: "Business Manager de Meta",
  },
  {
    integration: "clickup",
    label: "ClickUp",
    description: "Progreso y salud de proyectos (Clientes 360).",
    logoSrc: "/brand/integrations/clickup.svg",
    fields: [{ name: "token", label: "Token personal", kind: "secret" }],
    helpUrl: "https://app.clickup.com/settings/apps",
    helpText: "ClickUp → Settings → Apps",
  },
];
