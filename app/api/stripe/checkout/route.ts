import { NextResponse } from "next/server";

import { startCheckoutAction } from "@/lib/bookings/actions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bookingId: string;
  try {
    const body = (await request.json()) as { bookingId?: string };
    bookingId = body.bookingId ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const result = await startCheckoutAction(bookingId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    url: result.checkoutUrl,
  });
}
