/** Pausa entre requests para respetar rate limits (throttle secuencial). */
export const PACE_MS = 300;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
