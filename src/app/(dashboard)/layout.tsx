import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import {
  readableResources,
  type Role,
} from "@/modules/identity/domain/permissions";
import { AppHeader } from "@/shared/ui/app-header";
import { AppSidebar } from "@/shared/ui/app-sidebar";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administración",
  sales: "Ventas",
  operations: "Operaciones",
  finance: "Finanzas",
  management: "Gerencia",
};

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <SidebarProvider>
      <AppSidebar allowed={readableResources(user.role)} />
      <SidebarInset>
        <AppHeader
          userName={user.name ?? user.email}
          roleLabel={ROLE_LABELS[user.role]}
        />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <Toaster position="bottom-right" />
    </SidebarProvider>
  );
}
