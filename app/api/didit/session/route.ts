import { NextResponse } from "next/server";

import { createVerificationSession } from "@/lib/didit/client";
import { DiditNotAllowedError } from "@/lib/didit/guards";
import { isDiditConfigured } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isDiditConfigured()) {
    return NextResponse.json(
      { error: "Didit not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit(`didit-session:${user.id}`, 3, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const session = await createVerificationSession(user.id);

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("verification_requests")
      .update({ didit_session_id: session.sessionId })
      .eq("user_id", user.id)
      .eq("requested_role", "passenger")
      .is("reviewed_at", null)
      .select("id");

    const updatedCount = data?.length ?? 0;

    console.log("[didit/session] verification_requests update", {
      userId: user.id,
      sessionId: session.sessionId,
      data,
      error,
      count: updatedCount,
    });

    if (error) {
      console.error("[didit/session] failed to persist didit_session_id", {
        userId: user.id,
        error,
      });
    } else if (updatedCount === 0) {
      console.warn(
        "[didit/session] no open passenger verification_request matched update",
        { userId: user.id, sessionId: session.sessionId },
      );
    }

    return NextResponse.json({ redirectUrl: session.redirectUrl });
  } catch (e) {
    if (e instanceof DiditNotAllowedError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
