import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

/** Subkey HKDF derivada de la master key (info "oauth-state-hmac") — nunca se
 * usa la key AES directamente para firmar (nota de QA). */
function hmacKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex) throw new Error("CREDENTIALS_ENCRYPTION_KEY no está definida");
  return Buffer.from(
    hkdfSync("sha256", Buffer.from(hex, "hex"), Buffer.alloc(0), "oauth-state-hmac", 32),
  );
}

const sign = (data: string) =>
  createHmac("sha256", hmacKey()).update(data).digest("base64url");

/** State anti-CSRF firmado (stateless): provider.userId.nonce.ts.firma */
export function createOAuthState(provider: string, userId: string): string {
  const payload = [
    provider,
    userId,
    randomBytes(12).toString("base64url"),
    Date.now().toString(),
  ].join(".");
  return `${payload}.${sign(payload)}`;
}

/** Valida firma, expiración (10 min), provider y usuario de la sesión.
 * Nota (aceptada por QA): al ser stateless no hay nonce consumido — un
 * replay dentro del TTL es posible PERO exige la misma sesión admin
 * (state ligado a userId + re-validación de sesión y permiso en el
 * callback), así que el CSRF que el state previene sigue cubierto. */
export function verifyOAuthState(
  state: string,
  provider: string,
  userId: string,
): boolean {
  const parts = state.split(".");
  if (parts.length !== 5) return false;
  const [stateProvider, stateUserId, , ts, signature] = parts;
  const payload = parts.slice(0, 4).join(".");
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  if (stateProvider !== provider || stateUserId !== userId) return false;
  return Date.now() - Number(ts) < STATE_TTL_MS;
}
