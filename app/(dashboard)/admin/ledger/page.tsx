import { redirect } from "next/navigation";

export default function AdminLedgerLegacyRedirect() {
  redirect("/admin/revenue");
}
