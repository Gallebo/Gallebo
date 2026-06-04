import { NextResponse } from "next/server";

import { createVerificationSession } from "@/lib/didit/client";
import { DiditNotAllowedError } from "@/lib/didit/guards";
import { isDiditConfigured } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
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

    await supabase
      .from("verification_requests")
      .update({ didit_session_id: session.sessionId })
      .eq("user_id", user.id)
      .is("reviewed_at", null);

    return NextResponse.json({ redirectUrl: session.redirectUrl });
  } catch (e) {
    if (e instanceof DiditNotAllowedError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
