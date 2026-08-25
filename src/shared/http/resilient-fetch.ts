import {
  ExponentialBackoff,
  handleWhen,
  retry,
  timeout,
  TimeoutStrategy,
  wrap,
} from "cockatiel";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} en ${url}`);
    this.name = "HttpError";
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
