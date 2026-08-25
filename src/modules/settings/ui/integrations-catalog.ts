import type { Integration } from "@/modules/settings/domain/types";

export type IntegrationMeta = {
  integration: Integration;
  label: string;
  description: string;
  /** Logo oficial en public/brand/integrations/. */
  logoSrc: string;
  /** Qué cuenta usar al conectar (todas las integraciones son OAuth). */
  helpText: string;
};

/** Catálogo estático de integraciones — conexión solo por OAuth. */
export const INTEGRATIONS_CATALOG: IntegrationMeta[] = [
  {
    integration: "quickbooks",
    label: "QuickBooks",
    description:
      "Contabilidad: facturas, gastos y bancos se sincronizan a Finanzas.",
    logoSrc: "/brand/integrations/quickbooks.svg",
    helpText: "Conecta con la cuenta de Intuit de la empresa",
  },
  {
    integration: "meta_ads",
    label: "Meta Ads",
    description: "Métricas de campañas de Meta (Marketing).",
    logoSrc: "/brand/integrations/meta.svg",
    helpText: "Conecta con la cuenta de Facebook que administra tu Business",
  },
  {
    integration: "clickup",
    label: "ClickUp",
    description: "Progreso y salud de proyectos (Clientes 360).",
    logoSrc: "/brand/integrations/clickup.svg",
    helpText: "Conecta con tu cuenta de ClickUp",
  },
];
