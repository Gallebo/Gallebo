import { redirect } from "next/navigation";

import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Pilots",
  robots: privatePageRobots,
};

export default function AdminPilotsLegacyRedirect() {
  redirect("/admin/users");
}
