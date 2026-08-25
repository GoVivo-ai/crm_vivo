import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/modules/identity/application/get-current-user";

/**
 * Pantalla para usuarios autenticados en Clerk pero aún no activados en la
 * BD (o desactivados). Vive fuera de (dashboard) para no caer en el guard
 * del layout y evitar el loop sign-in → / → sign-in.
 */
export default async function PendingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="flex max-w-md flex-col items-start gap-3 rounded-lg border bg-card p-8">
        <span className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
          Cuenta pendiente
        </span>
        <h1 className="text-2xl font-semibold">Tu acceso está en revisión</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta existe pero un administrador todavía no la ha activado ni
          le ha asignado un rol. Avísale a tu admin de ERP VIVO y vuelve a
          entrar cuando te confirme.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="outline">Cerrar sesión</Button>
        </SignOutButton>
      </section>
    </main>
  );
}
