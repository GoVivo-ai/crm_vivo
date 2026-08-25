"use client";

import { Plus } from "lucide-react";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSpotlight } from "@/shared/ui/spotlight/spotlight-provider";
import { UserMenu } from "@/shared/ui/user-menu";

const SEGMENT_LABELS: Record<string, string> = {
  crm: "CRM",
  pipeline: "Pipeline",
  contacts: "Contactos",
  accounts: "Cuentas",
  deals: "Deals",
  clients: "Clientes",
  projects: "Proyectos",
  services: "Servicios",
  finance: "Finanzas",
  marketing: "Marketing",
  settings: "Ajustes",
  integrations: "Integraciones",
  purchases: "Gastos y compras",
  treasury: "Tesorería",
  people: "Equipo",
  leave: "Ausencias",
  profitability: "Rentabilidad",
  staffing: "Asignaciones",
};

function breadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return ["360"];
  // Segmentos dinámicos (ids) se muestran como "Detalle".
  return segments.map((s) => SEGMENT_LABELS[s] ?? "Detalle");
}

type AppHeaderProps = {
  userName: string;
  userEmail: string;
  roleLabel: string;
  initials: string;
};

export function AppHeader({
  userName,
  userEmail,
  roleLabel,
  initials,
}: AppHeaderProps) {
  const crumbs = breadcrumb(usePathname());
  const spotlight = useSpotlight();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="!h-5" />
      <nav aria-label="Ruta actual" className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <Fragment key={`${crumb}-${i}`}>
            {i > 0 && <span className="text-muted-foreground/60">/</span>}
            <span
              className={
                i === crumbs.length - 1
                  ? "font-medium"
                  : "text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </Fragment>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {spotlight.enabled && (
          <Button size="sm" onClick={spotlight.openSpotlight}>
            <Plus className="size-4" />
            Registrar
            <span className="ml-0.5 hidden rounded-md bg-[#011640]/15 px-1.5 py-px text-[10.5px] font-bold sm:inline">
              ⌘K
            </span>
          </Button>
        )}
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium">{userName}</p>
          <p className="text-xs leading-tight text-muted-foreground">
            {roleLabel}
          </p>
        </div>
        <UserMenu
          name={userName}
          email={userEmail}
          roleLabel={roleLabel}
          initials={initials}
        />
      </div>
    </header>
  );
}
