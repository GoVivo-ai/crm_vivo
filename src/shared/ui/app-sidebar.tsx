"use client";

import {
  Briefcase,
  Handshake,
  Landmark,
  Megaphone,
  Orbit,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { Resource } from "@/modules/identity/domain/permissions";

type NavItem = {
  resource: Resource;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Token del acento del módulo — riel de 3px en el ítem activo. */
  accent?: string;
  children?: { href: string; label: string }[];
};

type NavGroup = {
  /** null = sin etiqueta (360 arriba, Ajustes abajo). */
  label: string | null;
  items: NavItem[];
};

/** Agrupación por área del ERP; los módulos F6-F9 se suman a su grupo. */
const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ resource: "dashboard", href: "/", label: "360", icon: Orbit }],
  },
  {
    label: "Comercial",
    items: [
      {
        resource: "crm",
        href: "/crm",
        label: "CRM",
        icon: Handshake,
        accent: "var(--module-crm)",
        children: [
          { href: "/crm/pipeline", label: "Pipeline" },
          { href: "/crm/contacts", label: "Contactos" },
          { href: "/crm/accounts", label: "Cuentas" },
        ],
      },
      {
        resource: "marketing",
        href: "/marketing",
        label: "Marketing",
        icon: Megaphone,
        accent: "var(--module-marketing)",
        children: [
          { href: "/marketing", label: "Dashboard" },
          { href: "/marketing/accounts", label: "Cuentas de ads" },
        ],
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        resource: "clients",
        href: "/clients",
        label: "Clientes",
        icon: Briefcase,
        accent: "var(--module-clients)",
        children: [
          { href: "/clients", label: "Cuentas cliente" },
          { href: "/clients/services", label: "Servicios" },
        ],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        resource: "finance",
        href: "/finance",
        label: "Finanzas",
        icon: Landmark,
        accent: "var(--module-finance)",
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

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        tooltip={item.label}
        style={
          active && item.accent
            ? { boxShadow: `inset 3px 0 0 0 ${item.accent}` }
            : undefined
        }
      >
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
      {item.children && active && (
        <SidebarMenuSub>
          {item.children.map((child) => {
            // Activo solo el subítem con el prefijo más largo que matchea.
            const matching = item.children!.filter((c) =>
              pathname.startsWith(c.href),
            );
            const best = matching.reduce(
              (a, b) => (b.href.length > (a?.href.length ?? 0) ? b : a),
              matching[0],
            );
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  render={<Link href={child.href} />}
                  isActive={best?.href === child.href}
                >
                  {child.label}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

type AppSidebarProps = {
  /** Recursos legibles por el rol actual — el sidebar solo pinta estos.
   *  El enforcement real vive en el middleware y los guards de backend. */
  allowed: Resource[];
};

export function AppSidebar({ allowed }: AppSidebarProps) {
  const pathname = usePathname();
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.includes(i.resource)),
  })).filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sidebar-primary font-[family-name:var(--font-display)] text-sm font-bold text-sidebar-primary-foreground">
            V
          </span>
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            ERP VIVO
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? `g${i}`}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((item) => (
                <NavEntry key={item.resource} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
