import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  // NOTA: /api/cron se agregará aquí cuando existan las rutas (Fase 3),
  // siempre validando Authorization: Bearer CRON_SECRET — coordina Integraciones.
]);

// Capa 1 del RBAC: autenticación por ruta. El chequeo fino por rol vive
// en requirePermission() (capa 2) y el sidebar condicional (capa 3).
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
