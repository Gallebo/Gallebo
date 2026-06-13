"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import {
  AuthSubmitButton,
  authLabelClassName,
} from "@/components/auth/auth-form-styles";
import { FormMessage } from "@/components/auth/form-message";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
// TODO: Enable when OAuth Client IDs are configured
// import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import {
  registerAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { registerSchema, type RegisterFormValues } from "@/lib/auth/schemas";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );
  const [, startTransition] = useTransition();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = form.watch("password");

  useEffect(() => {
    if (state.error) {
      form.setError("root", { message: state.error });
    }
    if (state.success) {
      // trackEvent("registration");
    }
  }, [state.error, state.success, form]);

  return (
    <form
      method="post"
      className="space-y-5"
      onSubmit={form.handleSubmit((data) => {
        form.clearErrors("root");
        const fd = new FormData();
        fd.append("email", data.email);
        fd.append("password", data.password);
        fd.append("confirmPassword", data.confirmPassword);
        startTransition(() => {
          formAction(fd);
        });
      })}
    >
      <div className="space-y-2">
        <label htmlFor="email" className={authLabelClassName} style={{ color: "var(--ink)" }}>
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          size="lg"
          disabled={isPending}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className={authLabelClassName} style={{ color: "var(--ink)" }}>
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          size="lg"
          disabled={isPending}
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        <PasswordStrength password={passwordValue ?? ""} />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className={authLabelClassName} style={{ color: "var(--ink)" }}>
          Confirm password
        </label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          size="lg"
          disabled={isPending}
          aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
      <FormMessage error={form.formState.errors.root?.message} success={state.success} />
      <AuthSubmitButton disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          <>
            Create account
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </AuthSubmitButton>
    </form>
  );
}
