"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";

/** App shells (sidebar dashboards) fill the viewport; marketing footer is omitted. */
export function SiteFooterGate() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/pilot") ||
    pathname?.startsWith("/passenger") ||
    pathname?.startsWith("/admin");

  if (hideFooter) {
    return null;
  }

  return <SiteFooter />;
}
