import {
  ExponentialBackoff,
  handleWhen,
  retry,
  timeout,
  TimeoutStrategy,
  wrap,
} from "cockatiel";

/**
 * Reduce una URL a origin+path para mensajes de error: NUNCA query string
 * ni headers — el access_token de Meta viaja como query param y el Basic
 * Auth de Alegra en Authorization; ninguno debe llegar a logs, sync_runs
 * ni respuestas HTTP.
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

export class HttpError extends Error {
  /** origin+path de la request, sin query (sanitizada). */
  public readonly url: string;

  constructor(
    public readonly status: number,
    url: string,
    message?: string,
  ) {
    const safeUrl = sanitizeUrl(url);
    super(message ?? `HTTP ${status} en ${safeUrl}`);
    this.name = "HttpError";
    this.url = safeUrl;
  }
}

const isRetryable = (error: unknown) =>
  !(error instanceof HttpError) ||
  error.status === 429 ||
  error.status >= 500;

const retryPolicy = retry(handleWhen(isRetryable), {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 500, maxDelay: 8_000 }),
});

const timeoutPolicy = timeout(30_000, TimeoutStrategy.Aggressive);

const policy = wrap(retryPolicy, timeoutPolicy);

/**
 * fetch con timeout de 30s y retry exponencial (3 intentos) ante errores
 * de red, 429 y 5xx. Lanza HttpError en respuestas no-ok.
 */
export async function resilientFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return policy.execute(async ({ signal }) => {
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) {
      throw new HttpError(response.status, url);
    }
    return response;
  });
}
