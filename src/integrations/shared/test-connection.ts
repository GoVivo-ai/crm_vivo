/** Resultado de un test de conexión de integración ("probar antes de guardar"). */
export interface ConnectionTestResult {
  ok: boolean;
  /** Mensaje legible para mostrar en la UI de credenciales. */
  message: string;
}

/** Timeout corto: un test de conexión debe responder rápido, sin retries. */
export const TEST_TIMEOUT_MS = 10_000;

export function describeStatus(status: number, service: string): string {
  if (status === 401 || status === 403) {
    return `Credenciales de ${service} inválidas o sin permisos`;
  }
  if (status === 429) {
    return `${service} está limitando peticiones (rate limit); reintenta en unos minutos`;
  }
  if (status >= 500) {
    return `${service} respondió con un error del servidor (HTTP ${status}); reintenta más tarde`;
  }
  return `${service} respondió HTTP ${status}`;
}

export function describeNetworkError(error: unknown, service: string): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return `${service} no respondió en ${TEST_TIMEOUT_MS / 1000}s (timeout)`;
  }
  return `No se pudo conectar con ${service}: ${
    error instanceof Error ? error.message : String(error)
  }`;
}
