import { redirect } from "next/navigation";

import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Bookings",
  robots: privatePageRobots,
};

export default async function LegacyPassengerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.tab) qs.set("tab", params.tab);
  if (params.cancelled) qs.set("cancelled", params.cancelled);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/passenger/bookings${suffix}`);
}
