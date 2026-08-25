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
  fields: CredentialField[];
  helpUrl: string;
  helpText: string;
};

/** Catálogo estático de las integraciones configurables (solo metadata). */
export const INTEGRATIONS_CATALOG: IntegrationMeta[] = [
  {
    integration: "alegra",
    label: "Alegra",
    description: "Facturación, cartera, P&L y cashflow (Finanzas 360).",
    fields: [
      { name: "email", label: "Email de la cuenta", kind: "email" },
      { name: "token", label: "Token de API", kind: "secret" },
    ],
    helpUrl: "https://app.alegra.com/configuration/api",
    helpText: "Alegra → Configuración → API",
  },
  {
    integration: "windsor",
    label: "Windsor.ai",
    description: "Métricas de campañas de Meta y Google Ads (Marketing).",
    fields: [{ name: "apiKey", label: "API key", kind: "secret" }],
    helpUrl: "https://app.windsor.ai/",
    helpText: "app.windsor.ai → API Keys",
  },
  {
    integration: "clickup",
    label: "ClickUp",
    description: "Progreso y salud de proyectos (Clientes 360).",
    fields: [{ name: "token", label: "Token personal", kind: "secret" }],
    helpUrl: "https://app.clickup.com/settings/apps",
    helpText: "ClickUp → Settings → Apps",
  },
];
