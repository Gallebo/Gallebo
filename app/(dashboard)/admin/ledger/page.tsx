import { redirect } from "next/navigation";

import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Ledger",
  robots: privatePageRobots,
};

export default function AdminLedgerLegacyRedirect() {
  redirect("/admin/revenue");
}
