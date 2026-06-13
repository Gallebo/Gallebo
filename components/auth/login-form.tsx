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
// TODO: Enable when OAuth Client IDs are configured
// import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import {
  loginAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { loginSchema, type LoginFormValues } from "@/lib/auth/schemas";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [, startTransition] = useTransition();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (state.error) {
      form.setError("root", { message: state.error });
    }
  }, [state.error, form]);

  return (
    <form
      method="post"
      className="space-y-5"
      onSubmit={form.handleSubmit((data) => {
        form.clearErrors("root");
        const fd = new FormData();
        fd.append("email", data.email);
        fd.append("password", data.password);
        if (next) fd.append("next", next);
        startTransition(() => {
          formAction(fd);
        });
      })}
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className={authLabelClassName}
          style={{ color: "var(--ink)" }}
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          size="lg"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(form.formState.errors.email)}
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
        <label
          htmlFor="password"
          className={authLabelClassName}
          style={{ color: "var(--ink)" }}
        >
          Password
        </label>
        <PasswordInput
          id="password"
          size="lg"
          autoComplete="current-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          disabled={isPending}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <FormMessage
        error={form.formState.errors.root?.message}
        success={state.success}
      />
      <AuthSubmitButton disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Log in
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </AuthSubmitButton>
    </form>
  );
}
