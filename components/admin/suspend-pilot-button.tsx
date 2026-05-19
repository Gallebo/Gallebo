"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { suspendPilotAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

export function SuspendPilotButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await suspendPilotAction(userId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Suspend"}
    </Button>
  );
}
