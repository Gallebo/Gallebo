import { FormField, FormLabel } from "@/components/ui/form-field";
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
        <FormField>
          <FormLabel htmlFor="firstName">First name</FormLabel>
          <Input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            defaultValue={defaultValues?.firstName ?? undefined}
          />
        </FormField>
        <FormField>
          <FormLabel htmlFor="lastName">Last name</FormLabel>
          <Input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={defaultValues?.lastName ?? undefined}
          />
        </FormField>
      </div>
      <FormField>
        <FormLabel htmlFor="dateOfBirth">Date of birth</FormLabel>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          defaultValue={defaultValues?.dateOfBirth ?? undefined}
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="phone">Phone</FormLabel>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          defaultValue={defaultValues?.phone ?? undefined}
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="weightKg">Weight (kg)</FormLabel>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          min={30}
          max={300}
          required
          defaultValue={w}
        />
      </FormField>
    </>
  );
}
