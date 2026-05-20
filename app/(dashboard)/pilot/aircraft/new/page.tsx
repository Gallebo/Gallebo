import { NewAircraftForm } from "@/components/pilot/new-aircraft-form";
import { requirePilot } from "@/lib/auth/rbac";

export const metadata = { title: "New aircraft — Gallebo" };

export default async function NewAircraftPage() {
  await requirePilot();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Register an aircraft</h2>
      <NewAircraftForm />
    </div>
  );
}
