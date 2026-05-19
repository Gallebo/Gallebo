"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/lib/auth/delete-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const deleteConfirmSchema = z.object({
  confirm: z
    .string()
    .refine((v) => v === "DELETE", { message: "Type DELETE exactly to confirm" }),
});

const initialState: DeleteAccountState = {};

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialState
  );
  const form = useForm<z.input<typeof deleteConfirmSchema>>({
    resolver: zodResolver(deleteConfirmSchema),
    defaultValues: { confirm: "" },
  });

  useEffect(() => {
    if (state.error) {
      form.setError("root", { message: state.error });
    }
  }, [state.error, form]);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((data) => {
        form.clearErrors("root");
        const fd = new FormData();
        fd.append("confirm", data.confirm);
        formAction(fd);
      })}
    >
      <p className="text-sm text-muted-foreground">
        Type <strong>DELETE</strong> to confirm. This cannot be undone.
      </p>
      <Input
        placeholder="DELETE"
        autoComplete="off"
        {...form.register("confirm")}
      />
      {form.formState.errors.confirm ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.confirm.message}
        </p>
      ) : null}
      <FormMessage error={form.formState.errors.root?.message} />
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
