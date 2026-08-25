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

const NAV: NavItem[] = [
  { resource: "dashboard", href: "/", label: "360", icon: Orbit },
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
  {
    resource: "finance",
    href: "/finance",
    label: "Finanzas",
    icon: Landmark,
    accent: "var(--module-finance)",
  },
  {
    resource: "marketing",
    href: "/marketing",
    label: "Marketing",
    icon: Megaphone,
    accent: "var(--module-marketing)",
  },
  { resource: "settings", href: "/settings", label: "Ajustes", icon: Settings2 },
];

type AppSidebarProps = {
  /** Recursos legibles por el rol actual — el sidebar solo pinta estos.
   *  El enforcement real vive en el middleware y los guards de backend. */
  allowed: Resource[];
};

export function AppSidebar({ allowed }: AppSidebarProps) {
  const pathname = usePathname();
  const items = NAV.filter((item) => allowed.includes(item.resource));

  const isActive = (item: NavItem) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sidebar-primary font-[family-name:var(--font-display)] text-sm font-bold text-sidebar-primary-foreground">
            V
          </span>
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            CRM VIVO
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.resource}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive(item)}
                tooltip={item.label}
                style={
                  isActive(item) && item.accent
                    ? { boxShadow: `inset 3px 0 0 0 ${item.accent}` }
                    : undefined
                }
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {item.children && isActive(item) && (
                <SidebarMenuSub>
                  {item.children.map((child) => {
                    // Activo solo el subítem con el prefijo más largo que
                    // matchea, para que /clients/services no active /clients.
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
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
