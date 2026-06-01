import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

import { getPhoneEncryptionKey } from "@/lib/crypto/encryption-key";

function getKey(): Buffer {
  return scryptSync(getPhoneEncryptionKey(), "gallebo-weight-salt", 32);
}

export function encryptWeight(kg: number): Buffer {
  const key = getKey();
  const iv = randomBytes(12);
  const plaintext = kg.toString();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptWeight(data: Buffer): number {
  const key = getKey();
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
  return parseFloat(plaintext);
}

export function weightToDbValue(kg: number): string {
  return `\\x${encryptWeight(kg).toString("hex")}`;
}

export function weightFromDbValue(hex: string): number {
  const raw = hex.startsWith("\\x") ? hex.slice(2) : hex;
  return decryptWeight(Buffer.from(raw, "hex"));
}
