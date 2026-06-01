import { getServerEnv } from "@/lib/env";

const DEV_FALLBACK_KEY = "dev-only-change-me-32-chars-min!!!!!";

export function getPhoneEncryptionKey(): string {
  const key = getServerEnv().PHONE_ENCRYPTION_KEY;
  if (key) {
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PHONE_ENCRYPTION_KEY is required in production for encrypting phone and weight data",
    );
  }

  console.warn(
    "[crypto] PHONE_ENCRYPTION_KEY missing; using dev-only fallback",
  );
  return DEV_FALLBACK_KEY;
}
