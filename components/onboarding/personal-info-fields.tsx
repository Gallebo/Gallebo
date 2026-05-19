import { Input } from "@/components/ui/input";

export function PersonalInfoFields({
  defaultValues,
}: {
  defaultValues?: {
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    phone?: string | null;
    weightKg?: string | number | null;
  };
}) {
  const w =
    defaultValues?.weightKg != null && defaultValues.weightKg !== ""
      ? String(defaultValues.weightKg)
      : undefined;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={defaultValues?.firstName ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={defaultValues?.lastName ?? undefined}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="text-sm font-medium">
          Date of birth
        </label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          defaultValue={defaultValues?.dateOfBirth ?? undefined}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={defaultValues?.phone ?? undefined}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="weightKg" className="text-sm font-medium">
          Weight (kg)
        </label>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          min={30}
          max={300}
          required
          defaultValue={w}
        />
      </div>
    </>
  );
}
