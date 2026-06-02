"use client";

import { useState } from "react";

import { authInputClassName, authInputStyle } from "@/components/auth/auth-form-styles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type OAuthProvider = "google" | "apple";

function buildCallbackUrl(next?: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  if (next?.startsWith("/")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

async function signInWithProvider(provider: OAuthProvider, next?: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: buildCallbackUrl(next) },
  });
  if (error) throw error;
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        authInputClassName,
        "inline-flex h-12 w-full items-center justify-center gap-3 text-[15px] font-medium transition-all hover:brightness-[0.98] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      )}
      style={authInputStyle}
    >
      {icon}
      {label}
    </button>
  );
}

export function SocialAuthButtons({ next }: { next?: string }) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(provider: OAuthProvider) {
    setError(null);
    setLoading(provider);
    try {
      await signInWithProvider(provider, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <SocialButton
        label="Continue with Google"
        icon={<GoogleIcon />}
        disabled={loading !== null}
        onClick={() => handleSignIn("google")}
      />
      <SocialButton
        label="Continue with Apple"
        icon={<AppleIcon />}
        disabled={loading !== null}
        onClick={() => handleSignIn("apple")}
      />
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "var(--line)" }} />
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-3" style={{ background: "var(--surface)", color: "var(--ink-3)" }}>
            or
          </span>
        </div>
      </div>
    </div>
  );
}
