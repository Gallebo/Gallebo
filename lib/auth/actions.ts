"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";
import { getAppUrl } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Wrong email or password";
  if (message.includes("Email not confirmed")) return "Please confirm your email first";
  return message;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit(`auth:login:${ip}`);
  if (!limit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: mapAuthError(error.message) };
  }

  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/")) {
    redirect(next);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "verified" && profile.role === "admin") {
      redirect("/admin");
    }
    if (profile?.status === "verified" && profile.role === "pilot") {
      redirect("/pilot");
    }
    if (profile?.status === "verified" && profile.role === "passenger") {
      redirect("/passenger");
    }
    if (profile?.status === "verified" && profile.role === "airfield_operator") {
      redirect("/airfield");
    }
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit(`auth:register:${ip}`);
  if (!limit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Check your email to confirm your account, then sign in.",
  };
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address" };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit(`auth:forgot:${ip}`);
  if (!limit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });
  if (error) {
    return { error: error.message };
  }

  return { success: "If an account exists, you will receive a reset link." };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit(`auth:reset-password:${ip}`);
  if (!limit.allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
