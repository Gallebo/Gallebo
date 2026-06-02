import { redirect } from "next/navigation";

import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Settings",
  robots: privatePageRobots,
};

export default function LegacyNotificationSettingsPage() {
  redirect("/passenger/profile");
}
