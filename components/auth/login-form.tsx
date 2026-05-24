"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  AuthSubmitButton,
  authInputClassName,
  authInputStyle,
  authLabelClassName,
} from "@/components/auth/auth-form-styles";
import { FormMessage } from "@/components/auth/form-message";
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
    initialState
  );
  const [, startTransition] = useTransition();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (state.error) {
      form.setError("root", { message: state.error });
    }
  }, [state.error, form]);

  return (
    <form
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
        <label htmlFor="email" className={authLabelClassName} style={{ color: "var(--ink)" }}>
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={authInputClassName}
          style={authInputStyle}
          aria-invalid={Boolean(form.formState.errors.email)}
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
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="At least 8 characters"
          className={authInputClassName}
          style={authInputStyle}
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <FormMessage error={form.formState.errors.root?.message} success={state.success} />
      <AuthSubmitButton disabled={isPending}>
        {isPending ? "Signing in…" : (
          <>
            Log in
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </AuthSubmitButton>
    </form>
  );
}
