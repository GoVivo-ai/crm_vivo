"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Resource } from "@/modules/identity/domain/permissions";
import { NAV_GROUPS, type NavItem } from "@/shared/ui/sidebar-nav";

export type SidebarSync = {
  state: "ok" | "warn" | "error";
  title: string;
  detail: string;
};

export type SidebarUser = {
  name: string;
  email: string;
  roleLabel: string;
  initials: string;
};

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const reduced = useReducedMotion();
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        tooltip={item.label}
        className="vivo-pill"
      >
        {active &&
          (reduced ? (
            <span className="vivo-pill-bg" aria-hidden />
          ) : (
            // La píldora blanca se DESLIZA al nuevo ítem (layoutId compartido).
            <motion.span
              layoutId="vivo-pill-bg"
              className="vivo-pill-bg"
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            />
          ))}
        <item.icon />
        <span>{item.label}</span>
        {active && !reduced ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.12, duration: 0.18 }}
            className="vivo-odot"
            aria-hidden
          />
        ) : (
          <span className="vivo-odot" aria-hidden />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

type AppSidebarProps = {
  /** Recursos legibles por el rol — solo se pintan estos (enforcement
   *  real en middleware y guards del server). */
  allowed: Resource[];
  sync: SidebarSync;
  user: SidebarUser;
};

export function AppSidebar({ allowed, sync, user }: AppSidebarProps) {
  const pathname = usePathname();
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.includes(i.resource)),
  })).filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="vivo-sb">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Image
            src="/brand/logomark-white.png"
            alt=""
            width={30}
            height={22}
            className="hidden shrink-0 group-data-[collapsible=icon]:block"
          />
          <Image
            src="/brand/logo-vivo-white.png"
            alt="VIVO"
            width={78}
            height={32}
            priority
            className="group-data-[collapsible=icon]:hidden"
          />
          <span className="rounded-full border border-[#04D98B]/50 px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.14em] text-[#04D98B] group-data-[collapsible=icon]:hidden">
            ERP
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? `g${i}`} className="py-0">
            {group.label && (
              <p className="vivo-group-label px-3 pt-4 pb-2 group-data-[collapsible=icon]:hidden">
                {group.label}
              </p>
            )}
            <SidebarMenu className="gap-1">
              {group.items.map((item) => (
                <NavEntry key={item.resource} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-2 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <span className="vivo-sb-pulse" data-state={sync.state} aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-extrabold text-white">
              {sync.title}
            </p>
            <p className="truncate text-[10.5px] font-semibold text-white/50">
              {sync.detail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#04D98B] to-[#F2E205] font-[family-name:var(--font-display)] text-xs font-extrabold text-[#011640]">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-extrabold text-white">
              {user.name}
            </p>
            <p className="truncate text-[10.5px] font-semibold text-white/50">
              {user.email}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#04D98B]/15 px-2 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-[#04D98B] uppercase">
            {user.roleLabel}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
