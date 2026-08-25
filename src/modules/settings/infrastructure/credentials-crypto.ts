import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM
const TAG_LENGTH = 16;

function masterKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes en hex (64 caracteres)",
    );
  }
  return Buffer.from(hex, "hex");
}

/** Subkey AES derivada por HKDF (info "credentials-aes") — separación
 * criptográfica de la subkey HMAC del state OAuth (decisión Planeador). */
function getMasterKey(): Buffer {
  return Buffer.from(
    hkdfSync("sha256", masterKey(), Buffer.alloc(0), "credentials-aes", 32),
  );
}

/** SOLO para la migración de re-cifrado: descifra con la master key
 * directa (esquema anterior a la derivación HKDF). */
export function decryptPayloadLegacy<T>(encrypted: string): T {
  return decryptWith<T>(encrypted, masterKey());
}

/**
 * Cifra un payload JSON con AES-256-GCM. IV aleatorio por escritura;
 * el resultado es base64(iv || authTag || ciphertext).
 */
export function encryptPayload(payload: unknown): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}

/** Descifra lo producido por encryptPayload. Lanza si la key o el dato
 * no corresponden (authTag inválido). */
export function decryptPayload<T>(encrypted: string): T {
  return decryptWith<T>(encrypted, getMasterKey());
}

function decryptWith<T>(encrypted: string, key: Buffer): T {
  const raw = Buffer.from(encrypted, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
