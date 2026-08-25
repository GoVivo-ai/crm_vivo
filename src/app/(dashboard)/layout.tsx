import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readableResources } from "@/modules/identity/domain/permissions";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";

const NAV_LABELS: Record<string, { href: string; label: string }> = {
  dashboard: { href: "/", label: "Dashboard" },
  crm: { href: "/crm", label: "CRM" },
  clients: { href: "/clients", label: "Clientes" },
  finance: { href: "/finance", label: "Finanzas" },
  marketing: { href: "/marketing", label: "Marketing" },
  settings: { href: "/settings", label: "Configuración" },
};

// Layout placeholder de Fase 0 — frontend es dueño de esta capa y lo
// reemplazará con el sidebar shadcn definitivo.
export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const nav = readableResources(user.role).map((r) => NAV_LABELS[r]);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-56 flex-col border-r p-4">
        <div className="mb-6 font-semibold">CRM VIVO</div>
        <nav className="flex flex-col gap-2 text-sm">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 text-sm">
          <UserButton />
          <span>{user.name ?? user.email}</span>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
