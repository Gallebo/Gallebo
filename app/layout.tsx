import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Playfair_Display } from "next/font/google";

import { SiteFooterGate } from "@/components/layout/site-footer-gate";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";

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
  title: {
    default: "Gallebo — Share the cost of private flights",
    template: "%s | Gallebo",
  },
  description:
    "European platform connecting private pilots and passengers for legal EASA cost-sharing flights.",
  openGraph: {
    title: "Gallebo — Flight cost sharing",
    description:
      "Discover and share the cost of private flights across Europe.",
    type: "website",
    locale: "en_EU",
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('gallebo-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <SiteHeader />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <SiteFooterGate />
        </ThemeProvider>
      </body>
    </html>
  );
}
