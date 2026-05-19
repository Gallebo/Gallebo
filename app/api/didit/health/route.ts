import { NextResponse } from "next/server";

import { isDiditConfigured } from "@/lib/env";

export async function GET() {
  try {
    return NextResponse.json({ configured: isDiditConfigured() });
  } catch {
    return NextResponse.json({ configured: false }, { status: 500 });
  }
}
