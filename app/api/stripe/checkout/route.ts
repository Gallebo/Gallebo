import { NextResponse } from "next/server";
import { z } from "zod";

import { startCheckoutAction } from "@/lib/bookings/actions";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  bookingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
  }

  const { bookingId } = parsed.data;

  const result = await startCheckoutAction(bookingId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    url: result.checkoutUrl,
  });
}
