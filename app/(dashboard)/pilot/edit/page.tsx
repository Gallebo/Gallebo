import { PilotEditSections } from "@/components/pilot/pilot-edit-sections";
import { requirePilot } from "@/lib/auth/rbac";
import { phoneFromDbValue } from "@/lib/crypto/phone";
import { weightFromDbValue } from "@/lib/crypto/weight";
import { publicStorageUrl } from "@/lib/storage/public-url";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pilot profile — Gallebo" };

export default async function PilotEditPage() {
  await requirePilot();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, date_of_birth, phone_encrypted, weight_encrypted, avatar_path",
    )
    .eq("id", authUser.id)
    .single();

  if (error || !profile) {
    return <p className="text-muted-foreground">Unable to load profile.</p>;
  }

  let phonePlain = "";
  if (profile.phone_encrypted) {
    phonePlain = phoneFromDbValue(profile.phone_encrypted) ?? "";
  }

  let weightPlain = "";
  if (profile.weight_encrypted) {
    try {
      weightPlain = String(weightFromDbValue(profile.weight_encrypted));
    } catch {
      weightPlain = "";
    }
  }

  const avatarUrl =
    profile.avatar_path !== null &&
    profile.avatar_path !== undefined &&
    profile.avatar_path.length > 0
      ? publicStorageUrl("profile-photos", profile.avatar_path)
      : null;

  return (
    <div className="max-w-2xl space-y-10">
      <PilotEditSections
        profile={{
          firstName: profile.first_name ?? "",
          lastName: profile.last_name ?? "",
          dateOfBirth: profile.date_of_birth ?? "",
          phone: phonePlain,
          weightKg: weightPlain,
        }}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
