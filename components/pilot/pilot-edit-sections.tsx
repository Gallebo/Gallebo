"use client";

import Image from "next/image";
import { useActionState, useMemo } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPilotAvatarAction, updatePilotPersonalDataAction } from "@/lib/pilot/actions";

type ProfileDefaults = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  weightKg: string;
};

export function PilotEditSections({
  profile,
  avatarUrl,
}: {
  profile: ProfileDefaults;
  avatarUrl: string | null;
}) {
  const [personalState, personalAction] = useActionState(updatePilotPersonalDataAction, {});
  const [avatarState, avatarAction] = useActionState(uploadPilotAvatarAction, {});

  const avatarFallback = useMemo(
    () => (
      <div className="flex h-28 w-28 items-center justify-center rounded-full border bg-muted text-sm text-muted-foreground">
        No photo
      </div>
    ),
    [],
  );

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Profile photo</h2>
          <p className="text-sm text-muted-foreground">
            Shown on your public pilot profile.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
                unoptimized
              />
            ) : (
              avatarFallback
            )}
          </div>
          <form action={avatarAction} className="space-y-2">
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              required
            />
            {avatarState.error ? (
              <p className="text-sm text-destructive">{avatarState.error}</p>
            ) : null}
            {avatarState.success ? (
              <p className="text-sm text-green-600">{avatarState.success}</p>
            ) : null}
            <SubmitButton label="Upload photo" />
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Personal details</h2>
        <form action={personalAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="firstName">
                First name
              </label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={profile.firstName}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lastName">
                Last name
              </label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={profile.lastName}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="dateOfBirth">
              Date of birth
            </label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={profile.dateOfBirth}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">
              Phone
            </label>
            <Input id="phone" name="phone" defaultValue={profile.phone} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="weightKg">
              Weight (kg)
            </label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              defaultValue={profile.weightKg}
              required
            />
          </div>
          {personalState.error ? (
            <p className="text-sm text-destructive">{personalState.error}</p>
          ) : null}
          {personalState.success ? (
            <p className="text-sm text-green-600">{personalState.success}</p>
          ) : null}
          <Button type="submit">Save changes</Button>
        </form>
      </section>
    </div>
  );
}
