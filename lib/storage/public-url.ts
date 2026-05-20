import { getPublicEnv } from "@/lib/env";

/** Public Supabase Storage URL for a file in a public bucket. */
export function publicStorageUrl(bucket: string, path: string): string {
  const base = getPublicEnv().NEXT_PUBLIC_SUPABASE_URL ?? "";
  const encoded = path.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
