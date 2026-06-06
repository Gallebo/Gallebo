"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  adminDeleteUserAction,
  approveVerificationAction,
  assignRoleAndVerifyUserAction,
  rejectVerificationAction,
  suspendUserAction,
  unsuspendUserAction,
} from "@/lib/admin/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminUserActionsProps = {
  userId: string;
  rawRole: string | null;
  rawStatus: string;
  openVerificationId: string | null;
  isAdmin: boolean;
};

export function AdminUserActions({
  userId,
  rawRole,
  rawStatus,
  openVerificationId,
  isAdmin,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState<"passenger" | "pilot">("passenger");

  if (isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Admin accounts cannot be modified from this panel.
      </p>
    );
  }

  const run = (action: () => Promise<{ error?: string; success?: string }>) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(res.success ?? "Done");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      {openVerificationId ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Open verification</h3>
          <p className="text-sm text-muted-foreground">
            This user has a pending verification request. Approve or reject below,
            or open the full review page for Didit status and documents.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending}
              onClick={() => run(() => approveVerificationAction(openVerificationId))}
            >
              Approve verification
            </Button>
            <Link
              href={`/admin/verifications/${openVerificationId}`}
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Full review
            </Link>
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() =>
                rejectVerificationAction(
                  openVerificationId,
                  String(fd.get("reason") ?? ""),
                ),
              );
            }}
          >
            <Input
              name="reason"
              placeholder="Rejection reason"
              required
              className="max-w-sm"
            />
            <Button type="submit" variant="destructive" disabled={pending}>
              Reject verification
            </Button>
          </form>
        </section>
      ) : null}

      {!rawRole ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Assign role</h3>
          <p className="text-sm text-muted-foreground">
            User has not completed onboarding. Manually assign a role and mark the
            account as verified, or delete the account.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={assignRole}
              onChange={(e) =>
                setAssignRole(e.target.value as "passenger" | "pilot")
              }
              disabled={pending}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="passenger">Passenger</option>
              <option value="pilot">Pilot</option>
            </select>
            <Button
              disabled={pending}
              onClick={() =>
                run(() => assignRoleAndVerifyUserAction(userId, assignRole))
              }
            >
              Assign role & verify
            </Button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Account status</h3>
        <div className="flex flex-wrap gap-2">
          {rawStatus !== "suspended" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Suspend this account?")) return;
                run(() => suspendUserAction(userId));
              }}
            >
              Suspend account
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() => run(() => unsuspendUserAction(userId))}
            >
              Unsuspend account
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            const confirmed = window.prompt(
              'Type DELETE to permanently remove this account:',
            );
            if (confirmed !== "DELETE") return;
            startTransition(async () => {
              setError(null);
              setSuccess(null);
              const res = await adminDeleteUserAction(userId);
              if (res.error) {
                setError(res.error);
                return;
              }
              router.push("/admin/users");
              router.refresh();
            });
          }}
        >
          Delete account
        </Button>
      </section>
    </div>
  );
}
