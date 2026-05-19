import { NextResponse } from "next/server";

import { createVerificationSession } from "@/lib/didit/client";
import { isDiditConfigured } from "@/lib/env";
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

  try {
    const session = await createVerificationSession(user.id);

    await supabase
      .from("verification_requests")
      .update({ didit_session_id: session.sessionId })
      .eq("user_id", user.id)
      .eq("requested_role", "passenger")
      .is("reviewed_at", null);

    return NextResponse.json({ redirectUrl: session.redirectUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
