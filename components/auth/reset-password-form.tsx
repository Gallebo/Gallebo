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

  resetPasswordAction,

  type AuthActionState,

} from "@/lib/auth/actions";

import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/auth/schemas";

import { Input } from "@/components/ui/input";



const initialState: AuthActionState = {};



export function ResetPasswordForm() {

  const [state, formAction, isPending] = useActionState(

    resetPasswordAction,

    initialState

  );

  const [, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormValues>({

    resolver: zodResolver(resetPasswordSchema),

    defaultValues: { password: "", confirmPassword: "" },

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

        fd.append("password", data.password);

        fd.append("confirmPassword", data.confirmPassword);

        startTransition(() => {
          formAction(fd);
        });

      })}

    >

      <div className="space-y-2">

        <label htmlFor="password" className={authLabelClassName} style={{ color: "var(--ink)" }}>

          New password

        </label>

        <Input

          id="password"

          type="password"

          minLength={8}

          autoComplete="new-password"

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

      <div className="space-y-2">

        <label htmlFor="confirmPassword" className={authLabelClassName} style={{ color: "var(--ink)" }}>

          Confirm password

        </label>

        <Input

          id="confirmPassword"

          type="password"

          minLength={8}

          autoComplete="new-password"

          placeholder="Repeat your password"

          className={authInputClassName}

          style={authInputStyle}

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

        {isPending ? "Updating…" : (

          <>

            Update password

            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

              <path d="M5 12h14M13 6l6 6-6 6" />

            </svg>

          </>

        )}

      </AuthSubmitButton>

    </form>

  );

}

