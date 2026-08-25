import { getCurrentUser } from "@/modules/identity/application/get-current-user";
import {
  can,
  type Resource,
} from "@/modules/identity/domain/permissions";

/**
 * Guard DE PATRÓN para mutaciones en UI (criterio permanente de QA):
 * todo formulario de captura y botón de mutación se renderiza dentro de
 * <RequiresWrite resource="…"> — el can(role, resource, "write") se
 * resuelve aquí, en un único lugar. El enforcement real sigue en los
 * guards del server; esto evita exponer controles que serán rechazados.
 */
export async function RequiresWrite({
  resource,
  children,
  fallback = null,
}: {
  resource: Resource;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user === null || !can(user.role, resource, "write")) return fallback;
  return <>{children}</>;
}

/**
 * Variante para componentes client que reciben `canWrite` como prop
 * (botones de borrar/editar dentro de tablas client): la page lo computa
 * con este helper — misma resolución, mismo módulo, mismo criterio.
 */
export async function hasWrite(resource: Resource): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && can(user.role, resource, "write");
}
