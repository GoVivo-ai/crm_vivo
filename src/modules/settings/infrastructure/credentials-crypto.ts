import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const hex = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes en hex (64 caracteres)",
    );
  }
  return Buffer.from(hex, "hex");
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
  const raw = Buffer.from(encrypted, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getMasterKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
