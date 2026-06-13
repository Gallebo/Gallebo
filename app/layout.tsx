import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { SiteFooterGate } from "@/components/layout/site-footer-gate";
import { SiteHeader } from "@/components/layout/site-header";
import { becomePilotHref } from "@/lib/onboarding/guards";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getSiteUrl, getDefaultOgImageUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — Flight cost sharing`,
    description: "Discover and share the cost of private flights across Europe.",
    type: "website",
    locale: "en_EU",
    url: getSiteUrl(),
    siteName: SITE_NAME,
    images: [
      {
        url: getDefaultOgImageUrl(),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Flight cost sharing`,
    description: "Discover and share the cost of private flights across Europe.",
    images: [getDefaultOgImageUrl()],
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('gallebo-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    role: string | null;
    status: string;
    first_name: string | null;
    last_name: string | null;
  } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, status, first_name, last_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const pilotLink = becomePilotHref(Boolean(user), profile);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans bg-[var(--bg)] text-[var(--ink)] transition-colors duration-300">
        <ThemeProvider>
          <PostHogProvider>
            <SiteHeader
              user={user ? { email: user.email ?? "" } : null}
              profile={profile}
              pilotLink={pilotLink}
            />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
            <SiteFooterGate becomePilotHref={pilotLink} />
          </PostHogProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
