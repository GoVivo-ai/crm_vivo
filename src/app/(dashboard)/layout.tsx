import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getSyncStatus } from "@/modules/finance/application/finance-actions";
import type { SyncSource } from "@/modules/finance/domain/types";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import {
  readableResources,
  type Role,
} from "@/modules/identity/domain/permissions";
import { AppHeader } from "@/shared/ui/app-header";
import {
  AppSidebar,
  type SidebarSync,
} from "@/shared/ui/app-sidebar";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  sales: "Ventas",
  operations: "Operaciones",
  finance: "Finanzas",
  management: "Gerencia",
};

const SOURCE_SHORT: Record<SyncSource, string> = {
  quickbooks: "QBO",
  meta_ads: "Meta",
  clickup: "ClickUp",
};

function summarizeSync(
  runs: Partial<
    Record<SyncSource, { status: string; finishedAt: Date | null } | null>
  >,
): SidebarSync {
  const sources = Object.keys(SOURCE_SHORT) as SyncSource[];
  const failed = sources.filter((s) => runs[s]?.status === "error");
  const succeeded = sources.filter((s) => runs[s]?.status === "success");
  if (failed.length > 0) {
    return {
      state: "error",
      title: "Revisar sincronización",
      detail: `Falló ${failed.map((s) => SOURCE_SHORT[s]).join(" · ")}`,
    };
  }
  if (succeeded.length === 0) {
    return {
      state: "warn",
      title: "Sin sincronizar aún",
      detail: "Conecta tus integraciones en Ajustes",
    };
  }
  const latest = succeeded
    .map((s) => runs[s]?.finishedAt)
    .filter((d): d is Date => d !== null && d !== undefined)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const time = latest
    ? new Intl.DateTimeFormat("es-CO", { timeStyle: "short" }).format(latest)
    : "";
  return {
    state: "ok",
    title:
      succeeded.length === sources.length
        ? "Todo sincronizado"
        : "Sincronización parcial",
    detail: `${succeeded.map((s) => SOURCE_SHORT[s]).join(" · ")}${time ? ` · ${time}` : ""}`,
  };
}

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) {
    // Autenticado en Clerk pero inactivo/ausente en BD → /pending;
    // sin sesión → sign-in. Evita el loop de redirect.
    const { userId } = await auth();
    redirect(userId ? "/pending" : "/sign-in");
  }

  const syncResult = await getSyncStatus();
  const sync = summarizeSync(syncResult.ok ? syncResult.data : {});
  const name = user.name ?? user.email;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "236px",
          "--sidebar-width-icon": "68px",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        allowed={readableResources(user.role)}
        sync={sync}
        user={{
          name,
          email: user.email,
          roleLabel: ROLE_LABELS[user.role],
          initials: initials || "V",
        }}
      />
      <SidebarInset>
        <AppHeader
          userName={name}
          userEmail={user.email}
          roleLabel={ROLE_LABELS[user.role]}
          initials={initials || "V"}
        />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      {/* Toast de marca (§12.5): navy, máx 3, error con X persistente. */}
      <Toaster
        position="bottom-right"
        visibleToasts={3}
        closeButton
        toastOptions={{
          className: "vivo-toast",
        }}
      />
    </SidebarProvider>
  );
}
