import Link from "next/link";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { AuthFooterLink, AuthFieldFooter } from "@/components/auth/auth-form-styles";

export const metadata = { title: "Log in — Gallebo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthSplitLayout
      eyebrow="Log in"
      title="Welcome back."
      subtitle="Sign in to find flights, post routes, and message pilots."
      quote="I post the route I'm flying anyway, three strangers pay their share, and we land as friends."
      attribution="Luka M. · Pilot · Zagreb · 132 flights"
      footer={
        <AuthFieldFooter>
          New here?{" "}
          <AuthFooterLink href="/register">Create an account</AuthFooterLink>
        </AuthFieldFooter>
      }
    >
      <LoginForm next={next} />
      <p className="mt-4 text-center text-[13px]">
        <Link
          href="/forgot-password"
          className="transition-opacity hover:opacity-80"
          style={{ color: "var(--ink-3)" }}
        >
          Forgot password?
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
