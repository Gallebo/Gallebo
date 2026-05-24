import { redirect } from "next/navigation";

export default function AdminPilotsLegacyRedirect() {
  redirect("/admin/users");
}
