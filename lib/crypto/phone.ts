import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

import { getPhoneEncryptionKey } from "@/lib/crypto/encryption-key";

function getKey(): Buffer {
  return scryptSync(getPhoneEncryptionKey(), "gallebo-phone-salt", 32);
}

/** Encrypt phone for storage in profiles.phone_encrypted (bytea). */
export function encryptPhone(phone: string): Buffer {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(phone, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptPhone(data: Buffer): string {
  const key = getKey();
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

/** Encode bytea for Supabase insert (hex string). */
export function phoneToDbValue(phone: string): string {
  return `\\x${encryptPhone(phone).toString("hex")}`;
}

export function phoneFromDbValue(hex: string | null): string | null {
  if (!hex) return null;
  const raw = hex.startsWith("\\x") ? hex.slice(2) : hex;
  if (raw.length < 28) return null;
  try {
    return decryptPhone(Buffer.from(raw, "hex"));
  } catch {
    return null;
  }
}
