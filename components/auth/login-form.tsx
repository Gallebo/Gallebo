"use client";

import { useActionState, useEffect, useTransition, useState } from "react";

import {
  AuthSubmitButton,
  authInputClassName,
  authInputStyle,
  authLabelClassName,
} from "@/components/auth/auth-form-styles";
import { FormMessage } from "@/components/auth/form-message";
// TODO: Enable when OAuth Client IDs are configured
// import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import {
  loginAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { loginSchema } from "@/lib/auth/schemas";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

type FieldErrors = {
  email?: string;
  password?: string;
  root?: string;
};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (state.error) {
      setErrors((prev) => ({ ...prev, root: state.error }));
    }
  }, [state.error]);

  return (
    <form
      method="post"
      className="space-y-5"
      onSubmit={(event) => {
          event.preventDefault();
          const parsed = loginSchema.safeParse({ email, password });
          if (!parsed.success) {
            const nextErrors: FieldErrors = {};
            for (const issue of parsed.error.issues) {
              const field = issue.path[0];
              if (field === "email" || field === "password") {
                nextErrors[field] = issue.message;
              }
            }
            setErrors(nextErrors);
            return;
          }

          setErrors({});
          const fd = new FormData();
          fd.append("email", parsed.data.email);
          fd.append("password", parsed.data.password);
          if (next) fd.append("next", next);
          startTransition(() => {
            formAction(fd);
          });
        }}
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
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={authInputClassName}
            style={authInputStyle}
            aria-invalid={Boolean(errors.email)}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email}</p>
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
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="At least 8 characters"
            className={authInputClassName}
            style={authInputStyle}
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password}</p>
          ) : null}
        </div>
        <FormMessage error={errors.root} success={state.success} />
        <AuthSubmitButton disabled={isPending}>
          {isPending ? (
            "Signing in…"
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
