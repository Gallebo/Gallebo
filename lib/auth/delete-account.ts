"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/rbac";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const confirm = formData.get("confirm");
  if (confirm !== "DELETE") {
    return { error: 'Type DELETE to confirm' };
  }

  const user = await requireUser();
  const admin = createAdminClient();
  const supabase = await createClient();

  const buckets = [...new Set(Object.values(BUCKET_BY_TYPE))];

  for (const bucket of buckets) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files?.length) {
      const paths = files.flatMap((folder) => {
        if (folder.name && !folder.id) {
          return [`${user.id}/${folder.name}`];
        }
        return [];
      });

      if (paths.length) {
        await admin.storage.from(bucket).remove(paths);
      }

      const { data: nested } = await admin.storage.from(bucket).list(user.id, {
        limit: 1000,
      });

      if (nested) {
        for (const item of nested) {
          const { data: subFiles } = await admin.storage
            .from(bucket)
            .list(`${user.id}/${item.name}`);
          if (subFiles?.length) {
            await admin.storage
              .from(bucket)
              .remove(subFiles.map((f) => `${user.id}/${item.name}/${f.name}`));
          }
        }
      }
    }
  }

  await admin.from("profiles").delete().eq("id", user.id);

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return { error: authError.message };
  }

  await supabase.auth.signOut();
  redirect("/");
}
