import { z } from "zod";

/**
 * Contrato estándar de retorno de todos los Server Actions del proyecto
 * (aprobado por el Planeador): nunca se lanza hacia la UI; siempre se
 * retorna un ActionResult discriminado por `ok`.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError<T = never>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

/** Convierte un error de zod al formato fieldErrors del contrato. */
export function actionValidationError<T = never>(
  error: z.ZodError,
): ActionResult<T> {
  return {
    ok: false,
    error: "Datos inválidos",
    fieldErrors: z.flattenError(error).fieldErrors as Record<
      string,
      string[]
    >,
  };
}
